(function(imageproc) {
    "use strict";

    /*
     * Apply blur to the input data
     */
    imageproc.blur = function(inputData, outputData, kernelSize) {
        console.log("Applying blur with kernel size " + kernelSize + "x" + kernelSize);

        // Create a proper kernel based on the given kernel size
        // For simplicity, we create a kernel with all elements equal to 1
        var kernel = [];
        for (var i = 0; i < kernelSize; i++) {
            kernel.push([]);
            for (var j = 0; j < kernelSize; j++) {
                kernel[i].push(1);
            }
        }
    
        // Calculate the divisor (sum of all elements in the kernel)
        var divisor = kernelSize * kernelSize;
        // Apply the kernel to the whole image
        for (var y = 0; y < inputData.height; y++) {
            for (var x = 0; x < inputData.width; x++) {
                var sumR = 0, sumG = 0, sumB = 0;
                
                // Convolve the kernel over the pixel
                for (var ky = 0; ky < kernelSize; ky++) {
                    for (var kx = 0; kx < kernelSize; kx++) {
                        // Calculate the adjacent pixel for kernel processing
                        var pixelX = x + kx - Math.floor(kernelSize / 2);
                        var pixelY = y + ky - Math.floor(kernelSize / 2);

                            var pixel = imageproc.getPixel(inputData,pixelX,pixelY,"wrap");
                            sumR += pixel.r;
                            sumG += pixel.g;
                            sumB += pixel.b;
                    }
                }
                
                // Set the blurred pixel value to the output data
                var i = (x + y * outputData.width) * 4;
                outputData.data[i]     = sumR / divisor;
                outputData.data[i + 1] = sumG / divisor;
                outputData.data[i + 2] = sumB / divisor;
            }
        }
    };

}(window.imageproc = window.imageproc || {}));
