(function (imageproc) {
    "use strict";

    /*
     * Apply the basic processing operations
     */
    function applyBasicOp(inputImage, outputImage) {
        switch (currentBasicOp) {
            // Apply negation
            case "negation":
                imageproc.negation(inputImage, outputImage);
                break;

            // Apply grayscale
            case "grayscale":
                imageproc.grayscale(inputImage, outputImage);
                break;

            // Apply brightness
            case "brightness":
                var offset = parseInt($("#brightness-offset").val());
                imageproc.brightness(inputImage, outputImage, offset);
                break;

            // Apply contrast
            case "contrast":
                var factor = parseFloat($("#contrast-factor").val());
                imageproc.contrast(inputImage, outputImage, factor);
                break;

            // Apply posterization
            case "posterization":
                var rbits = parseInt($("#posterization-red-bits").val());
                var gbits = parseInt($("#posterization-green-bits").val());
                var bbits = parseInt($("#posterization-blue-bits").val());
                imageproc.posterization(inputImage, outputImage, rbits, gbits, bbits);
                break;

            // Apply threshold
            case "threshold":
                var threshold = parseFloat($("#threshold-value").val());
                imageproc.threshold(inputImage, outputImage, threshold);
                break;

            // Apply comic colour
            case "comic-color":
                var saturation = parseInt($("#comic-color-saturation").val());
                imageproc.comicColor(inputImage, outputImage, saturation);
                break;

            // Apply automatic contrast
            case "auto-contrast":
                var type = $("#auto-contrast-type").val();
                var percentage = parseInt($("#auto-contrast-percentage").val()) / 100.0;
                imageproc.autoContrast(inputImage, outputImage, type, percentage);
                break;
        }
    }

    /*
     * Apply the base layer operations
     */
    function applyBaseLayerOp(inputImage, processedImage, outputImage) {
        switch (currentBaseLayerOp) {
            // Apply blur
            case "blur":
                if ($("#blur-input").val() == "processed")
                    inputImage = processedImage;
                var size = parseInt($("#blur-kernel-size").val());
                imageproc.blur(inputImage, outputImage, size);
                break;

            // Apply kuwahara
            case "kuwahara":
                if ($("#kuwahara-input").val() == "processed")
                    inputImage = processedImage;
                var size = parseInt($("#kuwahara-filter-size").val());
                imageproc.kuwahara(inputImage, outputImage, size);
                break;
        }
    }

    /*
     * Apply the shade layer operations
     */
    async function applyShadeLayerOp(inputImage, processedImage, outputImage) {
        switch (currentShadeLayerOp) {
            // Apply dither
            case "dither":
                if ($("#dither-input").val() == "processed")
                    inputImage = processedImage;
                imageproc.dither(inputImage, outputImage,
                    $("#dither-matrix-type").val());
                break;

            case "errordither":
                var type;
                var color;
                if ($("#errordither-input").val() == "processed")
                    inputImage = processedImage;
                if ($("#errordither-method").val() === "normal") {
                    type = "normal";
                } else {
                    type = "floyd";
                }

                // errordither-color is a checkbox
                if ($("#errordither-color").prop("checked")) {
                    color = "color";
                } else {
                    color = "gray";
                }

                var time = 0;
                if ($("#errordither-multi").prop("checked")) {
                    time = await imageproc.measureExecutionTime(
                        async function () {
                            await imageproc.errorDitherMultiThread(inputImage, outputImage, type, color);
                        }
                    );
                } else {
                    time = await imageproc.measureExecutionTime(
                        imageproc.errorDither,
                        inputImage, outputImage, type, color
                    );
                }

                // Find the time-used id text and set the time, round it to 2 decimal places
                $("#time-used").text(time.toFixed(2) + "ms");
                break;
        }
    }

    /*
     * Apply the outline layer operations
     */
    function applyOutlineLayerOp(inputImage, processedImage, outputImage) {
        switch (currentOutlineLayerOp) {
            // Apply sobel edge detection
            case "sobel":
                if ($("#sobel-input").val() == "processed")
                    inputImage = processedImage;

                // Use the grayscale image
                var grayscale = imageproc.createBuffer(outputImage);
                imageproc.grayscale(inputImage, grayscale);

                // Blur if needed
                if ($("#sobel-blur").prop("checked")) {
                    var blur = imageproc.createBuffer(outputImage);
                    var size = parseInt($("#sobel-blur-kernel-size").val());
                    imageproc.blur(grayscale, blur, size);
                    grayscale = blur;
                }

                var threshold = parseInt($("#sobel-threshold").val());
                imageproc.sobelEdge(grayscale, outputImage, threshold);

                // Flip edge values
                if ($("#sobel-flip").prop("checked")) {
                    for (var i = 0; i < outputImage.data.length; i += 4) {
                        if (outputImage.data[i] == 0) {
                            outputImage.data[i] =
                                outputImage.data[i + 1] =
                                    outputImage.data[i + 2] = 255;
                        } else {
                            outputImage.data[i] =
                                outputImage.data[i + 1] =
                                    outputImage.data[i + 2] = 0;
                        }
                    }
                }
                break;
        }
    }

    /*
     * The image processing operations are set up for the different layers.
     * Operations are applied from the base layer to the outline layer. These
     * layers are combined appropriately when required.
     */
    imageproc.operation = async function (inputImage, outputImage) {
        // Apply the basic processing operations
        var processedImage = inputImage;
        if (currentBasicOp != "no-op") {
            processedImage = imageproc.createBuffer(outputImage);
            applyBasicOp(inputImage, processedImage);
        }

        // Apply the base layer operations
        var baseLayer = processedImage;
        if (currentBaseLayerOp != "no-op") {
            baseLayer = imageproc.createBuffer(outputImage);
            applyBaseLayerOp(inputImage, processedImage, baseLayer);
        }

        // Apply the shade layer operations
        var shadeLayer = baseLayer;
        if (currentShadeLayerOp != "no-op") {
            shadeLayer = imageproc.createBuffer(outputImage);
            await applyShadeLayerOp(inputImage, processedImage, shadeLayer);

            // Show base layer for dithering
            if (currentShadeLayerOp == "dither" &&
                $("#dither-transparent").prop("checked")) {
                for (var i = 0; i < shadeLayer.data.length; i += 4) {
                    var l = shadeLayer.data[i] + shadeLayer.data[i + 1] + shadeLayer.data[i + 2];
                    l = l / 3;
                    if (l == 255) {
                        for (var j = 0; j < 4; j++) {
                            shadeLayer.data[i + j] = baseLayer.data[i + j];
                        }
                    }


                }

            }
        }

        // Apply the outline layer operations
        var outlineLayer = shadeLayer;
        if (currentOutlineLayerOp != "no-op") {
            outlineLayer = imageproc.createBuffer(outputImage);
            applyOutlineLayerOp(inputImage, processedImage, outlineLayer);

            // Show shade layer for non-edge pixels
            if (currentOutlineLayerOp == "sobel" &&
                $("#sobel-transparent").prop("checked")) {
                var flip = $("#sobel-flip").prop("checked");
                console.log(flip ? 0 : 255);
                for (var i = 0; i < outlineLayer.data.length; i += 4) {
                    var l = outlineLayer.data[i] + outlineLayer.data[i + 1] + outlineLayer.data[i + 2];
                    l = l / 3;
                    if (l != (flip ? 0 : 255)) {
                        for (var j = 0; j < 4; j++) {
                            outlineLayer.data[i + j] = shadeLayer.data[i + j];
                        }
                    }


                }
                /**
                 * TODO: You need to show the shade layer (shadeLayer) for
                 * the non-edge pixels (transparent)
                 */

            }
        }

        // Show the accumulated image
        imageproc.copyImageData(outlineLayer, outputImage);
    }

}(window.imageproc = window.imageproc || {}));
