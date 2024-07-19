onmessage = function (e) {
    var ind = e.data.index;
    var inputData = e.data.inputData;
    var rBits = e.data.rBits;
    var gBits = e.data.gBits;
    var bBits = e.data.bBits;
    var type = e.data.type;
    var color = e.data.color;
    console.log(type,color)
    function getPixel(imageData, x, y, border) {
        // Handle the boundary cases
        if (x < 0)
            x = (border=="wrap")? imageData.width + (x % imageData.width) : 0;
        if (x >= imageData.width)
            x = (border=="wrap")? x % imageData.width : imageData.width - 1;
        if (y < 0)
            y = (border=="wrap")? imageData.height + (y % imageData.height) : 0;
        if (y >= imageData.height)
            y = (border=="wrap")? y % imageData.height : imageData.height - 1;

        var i = (x + y * imageData.width) * 4;
        return {
            r: imageData[i],
            g: imageData[i + 1],
            b: imageData[i + 2],
            a: imageData[i + 3]
        };
    }
    function posterizeChannel(value, bits) {
        var shift = 8 - bits;
        return (value >> shift) << shift;
    }

    function distributeError(data, width, height, x, y, dr, dg, db, coeff) {
        var nx = x;
        var ny = y;
        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
            var nindex = (nx + ny * width) * 4;
            data[nindex] = Math.min(255, Math.max(0, data[nindex] + dr * coeff / 16));
            data[nindex + 1] = Math.min(255, Math.max(0, data[nindex + 1] + dg * coeff / 16));
            data[nindex + 2] = Math.min(255, Math.max(0, data[nindex + 2] + db * coeff / 16));
        }
    }
    function distributeError2(data, width, height, x, y, dr, dg, db, coeff) {
        var nx = x;
        var ny = y;
        if(nx > inputData.width){
            ny++;
            nx = 0;
        }
        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
            var nindex = (nx + ny * width) * 4;
            data[nindex] = Math.min(255, Math.max(0, data[nindex] + dr * coeff / 16));
            data[nindex + 1] = Math.min(255, Math.max(0, data[nindex + 1] + dg * coeff / 16));
            data[nindex + 2] = Math.min(255, Math.max(0, data[nindex + 2] + db * coeff / 16));
        }
    }
    var oData = new Uint8ClampedArray(inputData.data);
    if(type === "floyd" && color === "color") {
        for (var y = 0; y < inputData.height; y++) {
            for (var x = 0; x < inputData.width; x++) {
                var index = (x + y * inputData.width) * 4;
                var oldR = oData[index];
                var oldG = oData[index + 1];
                var oldB = oData[index + 2];

                var newR = posterizeChannel(oldR, rBits);
                var newG = posterizeChannel(oldG, gBits);
                var newB = posterizeChannel(oldB, bBits);

                // Set the pixel value to the posterized color
                oData[index] = newR;
                oData[index + 1] = newG;
                oData[index + 2] = newB;
                oData[index + 3] = 255;

                // Calculate errors
                var errorR = oldR - newR;
                var errorG = oldG - newG;
                var errorB = oldB - newB;

                // Distribute the errors using Floyd-Steinberg matrix
                distributeError(oData, inputData.width, inputData.height, x + 1, y, errorR, errorG, errorB, 7);
                distributeError(oData, inputData.width, inputData.height, x - 1, y + 1, errorR, errorG, errorB, 3);
                distributeError(oData, inputData.width, inputData.height, x, y + 1, errorR, errorG, errorB, 5);
                distributeError(oData, inputData.width, inputData.height, x + 1, y + 1, errorR, errorG, errorB, 1);
            }
        }
    }
    else if(type==="floyd" && color === "gray") {
        //copy the input data to the output data
        console.log("123")
        for (var i = 0; i < inputData.data.length; i++) {
            oData[i] = inputData.data[i];
        }

        // Floyd-Steinberg error diffusion matrix
        var errorMatrix = [
            [0, 0, 7],
            [3, 5, 1]
        ];
        var threshold = 128; // You can adjust this value as needed
        let pixel = {};
        for (var i = 0; i < inputData.width; i++) {
            for (var j = 0; j < inputData.height; j++) {
                index = (i + j * inputData.width) * 4;
                pixel = {
                    r: oData[index],
                    g: oData[index + 1],
                    b: oData[index + 2]
                };

                // Compute grayscale intensity
                var intensity = (pixel.r + pixel.g + pixel.b) / 3;
                var error = 0;

                // Apply thresholding
                if (intensity > threshold) {
                    pixel.r = pixel.g = pixel.b = 255;
                    error = intensity - 255;
                } else {
                    pixel.r = pixel.g = pixel.b = 0;
                    error = intensity;
                }

                // Update the pixel
                oData[index] = pixel.r;
                oData[index + 1] = pixel.g;
                oData[index + 2] = pixel.b;
                oData[index + 3] = 255;

                for (var k = 0; k < 2; k++) {
                    for (var l = 0; l < 3; l++) {
                        var x = i + l - 1;
                        var y = j + k;

                        if (x >= 0 && x < inputData.width && y < inputData.height) {
                            var index2 = (x + y * inputData.width) * 4;

                            oData[index2] = oData[index2] + errorMatrix[k][l] * error / 16;
                            oData[index2 + 1] = oData[index2] + errorMatrix[k][l] * error / 16;
                            oData[index2 + 2] = oData[index2] + errorMatrix[k][l] * error / 16;
                        }
                    }
                }
            }
        }
    }
    else if(type === "normal" && color === "color") {
        for (var i = 0; i < inputData.data.length; i++) {
            oData[i] = inputData.data[i];
        }
        var pixel ={};
        for (var y = 0; y < inputData.height; y++) {
            for (var x = 0; x < inputData.width; x++) {
                var index = (x + y * inputData.width) * 4;
                pixel = {
                    r: oData[index],
                    g: oData[index + 1],
                    b: oData[index + 2]
                };
                // Posterize each color channel
                var oldR = pixel.r;
                var oldG = pixel.g;
                var oldB = pixel.b;
                var newR = posterizeChannel(oldR, rBits);
                var newG = posterizeChannel(oldG, gBits);
                var newB = posterizeChannel(oldB, bBits);

                // Set the pixel value to the posterized color
                oData[index] = newR;
                oData[index + 1] = newG;
                oData[index + 2] = newB;
                oData[index + 3] = 255;

                // Calculate errors
                var errorR = oldR - newR;
                var errorG = oldG - newG;
                var errorB = oldB - newB;

                // Distribute the error to next pixels
                distributeError2(oData, inputData.width, inputData.height, x + 1, y, errorR, errorG, errorB, 16);
            }
        }
    }
    if(type === "normal" && color === "gray") {
        var r=0,g=0,b=0;
        var pixel = {};
        var error = 0;
        var threshold = 128;
        for (var i = 0; i < inputData.width; i++) {
            for (var j = 0; j < inputData.height; j++) {
                index = (i + j * inputData.width) * 4;
                pixel = {
                    r: oData[index],
                    g: oData[index + 1],
                    b: oData[index + 2]
                };
                r = pixel.r + error;
                g = pixel.g + error;
                b = pixel.b + error;
                intensity = (r + g + b) / 3;
                if (intensity > threshold) {
                    r = g = b = 255;
                    error = intensity - 255;
                } else {
                    r = g = b = 0;
                    error = intensity;
                }
                oData[index] = r;
                oData[index + 1] = g;
                oData[index + 2] = b;
                oData[index + 3] = 255;
            }
        }
    }
    postMessage({
        index: ind,
        result: oData
    });
};
