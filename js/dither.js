(function (imageproc) {
    "use strict";
    imageproc.measureExecutionTime = async function (fn, ...args) {
        var start = performance.now();
        await fn(...args);  // If fn is asynchronous, await its resolution
        var end = performance.now();
        return end - start;
    };
    /*
     * Apply ordered dithering to the input data
     */
    imageproc.dither = function (inputData, outputData, matrixType) {
        console.log("Applying dithering...");

        /*
         * TODO: You need to extend the dithering processing technique
         * to include multiple matrix types
         */

        // At the moment, the code works only for the Bayer's 2x2 matrix
        // You need to include other matrix types
        var matrix;
        var t;
        // Set up the matrix
        if (matrixType == "bayer2") {
            matrix = [[1, 3], [4, 2]];
            t = 2;
        }
        if (matrixType == "bayer4") {
            matrix = [[1, 9, 3, 11], [13, 5, 15, 7], [4, 12, 2, 10], [16, 8, 14, 6]]
            t = 4;
        }
        if (matrixType == "line") {
            matrix = [[15, 15, 15, 25], [15, 15, 25, 15], [15, 25, 15, 15], [25, 15, 15, 15]];
            t = 4;
        }
        if (matrixType == "diamond") {
            matrix = [[15, 15, 25, 15, 15], [15, 25, 15, 25, 15], [25, 15, 15, 15, 25], [15, 25, 15, 25, 15], [15, 15, 25, 15, 15]];
            t = 5;
        }
        console.log(matrix)
        var levels = Math.max(...matrix.flat()) + 1;
        if (matrixType == "line" || matrixType == "diamond") {
            levels = 100;
        }
        // The following code uses Bayer's 2x2 matrix to create the
        // dithering effect. You need to extend it to work for different
        // matrix types
        for (var y = 0; y < inputData.height; y++) {
            for (var x = 0; x < inputData.width; x++) {
                var pixel = imageproc.getPixel(inputData, x, y);

                // Change the colour to grayscale and normalize it
                var value = (pixel.r + pixel.g + pixel.b) / 3;
                value = value / 255 * levels;
                // Get the corresponding threshold of the pixel
                var threshold = matrix[y % t][x % t];

                // Set the colour to black or white based on threshold
                var i = (x + y * outputData.width) * 4;
                outputData.data[i] = (value < threshold) ? 0 : 255;
                outputData.data[i + 1] = (value < threshold) ? 0 : 255;
                outputData.data[i + 2] = (value < threshold) ? 0 : 255;
            }
        }
    }
    imageproc.calculateIntensityError = function (img1, img2) {
        var intensityError = 0;
        var chunkSize = 4; // Number of pixels per chunk
        var temp = 0;
        var avg = 0;
        var k = 0;

        for (var i = 0; i < img1.data.length; i += 4) {
            var r1 = img1.data[i];
            var g1 = img1.data[i + 1];
            var b1 = img1.data[i + 2];

            var r2 = img2.data[i];
            var g2 = img2.data[i + 1];
            var b2 = img2.data[i + 2];

            // Calculate the intensity difference between the two images
            var intensity1 = (r1 + g1 + b1) / 3;
            var intensity2 = (r2 + g2 + b2) / 3;
            var intensityDifference = Math.abs(intensity1 - intensity2);

            temp += intensityDifference;
            k++;

            // If we've reached the end of a chunk, calculate the average difference for that chunk
            if (k === chunkSize) {
                intensityError += temp / chunkSize;
                temp = 0;
                k = 0;
                avg++;
            }
        }

        // Compute the overall average error
        if (avg > 0) {
            intensityError = intensityError / avg;
        } else {
            intensityError = 0;
        }

        return intensityError;
    };
    imageproc.bound = function (val,min,max){
        return Math.max(min,Math.min(val,max));
    }
    imageproc.errorDither = function (inputData, outputData, type, color) {
        console.log(type, color);
        var threshold = 128;
        var error = 0;
        var intensity = 0;
        var r = 0, g = 0, b = 0;
        var pixel, index;
        if (type === "normal" && color === "gray") {
            console.log("normal gray");

            for (var i = 0; i < inputData.width; i++) {
                for (var j = 0; j < inputData.height; j++) {
                    pixel = imageproc.getPixel(inputData, i, j);
                    index = (i + j * outputData.width) * 4;

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
                    outputData.data[index] = r;
                    outputData.data[index + 1] = g;
                    outputData.data[index + 2] = b;
                    outputData.data[index + 3] = 255;
                }
            }
        }

        function posterizeChannel(value, bits) {
            // Calculate the number of levels
            var shift = 8 - bits;
            return (value >> shift) << shift;
        }

        // Helper function to distribute the error to neighboring pixels
        function distributeError2(x, y, dr, dg, db, coeff) {
            var nx = x;
            var ny = y;
            if (nx > inputData.width) {
                ny++;
                nx = 0;
            }
            if (nx >= 0 && nx < inputData.width && ny >= 0 && ny < inputData.height) {
                var nindex = (nx + ny * outputData.width) * 4;
                outputData.data[nindex] = Math.min(255, Math.max(0, outputData.data[nindex] + dr * coeff / 16));
                outputData.data[nindex + 1] = Math.min(255, Math.max(0, outputData.data[nindex + 1] + dg * coeff / 16));
                outputData.data[nindex + 2] = Math.min(255, Math.max(0, outputData.data[nindex + 2] + db * coeff / 16));
            }
        }

        function distributeError(x, y, dr, dg, db, coeff) {
            var nx = x;
            var ny = y;
            if (nx >= 0 && nx < inputData.width && ny >= 0 && ny < inputData.height) {
                var nindex = (nx + ny * outputData.width) * 4;
                outputData.data[nindex] = Math.min(255, Math.max(0, outputData.data[nindex] + dr * coeff / 16));
                outputData.data[nindex + 1] = Math.min(255, Math.max(0, outputData.data[nindex + 1] + dg * coeff / 16));
                outputData.data[nindex + 2] = Math.min(255, Math.max(0, outputData.data[nindex + 2] + db * coeff / 16));
            }
        }

        if (type === "normal" && color === "color") {
            var rBits = parseInt($("#error-red-bits").val());
            var gBits = parseInt($("#error-green-bits").val());
            var bBits = parseInt($("#error-blue-bits").val());

            for (var i = 0; i < inputData.data.length; i++) {
                outputData.data[i] = inputData.data[i];
            }

            for (var y = 0; y < inputData.height; y++) {
                for (var x = 0; x < inputData.width; x++) {
                    var index = (x + y * outputData.width) * 4;
                    var pixel = imageproc.getPixel(outputData, x, y);

                    // Posterize each color channel
                    var oldR = pixel.r;
                    var oldG = pixel.g;
                    var oldB = pixel.b;
                    var newR = posterizeChannel(oldR, rBits);
                    var newG = posterizeChannel(oldG, gBits);
                    var newB = posterizeChannel(oldB, bBits);

                    // Set the pixel value to the posterized color
                    outputData.data[index] = newR;
                    outputData.data[index + 1] = newG;
                    outputData.data[index + 2] = newB;
                    outputData.data[index + 3] = 255;

                    // Calculate errors
                    var errorR = oldR - newR;
                    var errorG = oldG - newG;
                    var errorB = oldB - newB;

                    // Distribute the error to next pixels
                    distributeError2(x + 1, y, errorR, errorG, errorB, 16);
                }
            }
        }
        if (type === "floyd" && color === "gray") {
            console.log("floyd gray");

            // Copy input data to output data (shallow copy)
            for (var i = 0; i < inputData.data.length; i++) {
                outputData.data[i] = inputData.data[i];
            }

            // Floyd-Steinberg error diffusion matrix
            var errorMatrix = [
                [0, 0, 7],
                [3, 5, 1]
            ];
            var threshold = 128; // You can adjust this value as needed

            for (var i = 0; i < inputData.width; i++) {
                for (var j = 0; j < inputData.height; j++) {
                    var index = (i + j * outputData.width) * 4;
                    var pixel = {
                        r: outputData.data[index],
                        g: outputData.data[index + 1],
                        b: outputData.data[index + 2]
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
                    outputData.data[index] = pixel.r;
                    outputData.data[index + 1] = pixel.g;
                    outputData.data[index + 2] = pixel.b;
                    outputData.data[index + 3] = 255; // Alpha channel

                    // Distribute error using the Floyd-Steinberg matrix
                    for (var k = 0; k < 2; k++) {
                        for (var l = 0; l < 3; l++) {
                            var x = i + l - 1;
                            var y = j + k;

                            if (x >= 0 && x < inputData.width && y < inputData.height) {
                                var index2 = (x + y * inputData.width) * 4;

                                outputData.data[index2] = outputData.data[index2] + errorMatrix[k][l] * error / 16;
                                outputData.data[index2 + 1] = outputData.data[index2] + errorMatrix[k][l] * error / 16;
                                outputData.data[index2 + 2] = outputData.data[index2] + errorMatrix[k][l] * error / 16;
                            }
                        }
                    }
                }
            }
        }
        if (type === "floyd" && color === "color") {
            // Floyd-Steinberg dithering in 8-bit colors
            //get the bits from id:posterization-{color}-bits
            var rBits = parseInt($("#error-red-bits").val());
            var gBits = parseInt($("#error-green-bits").val());
            var bBits = parseInt($("#error-blue-bits").val());

            for (var i = 0; i < inputData.data.length; i++) {
                outputData.data[i] = inputData.data[i];
            }

            for (var y = 0; y < inputData.height; y++) {
                for (var x = 0; x < inputData.width; x++) {
                    var index = (x + y * outputData.width) * 4;
                    var pixel = imageproc.getPixel(outputData, x, y);

                    // Posterize each color channel
                    var oldR = pixel.r;
                    var oldG = pixel.g;
                    var oldB = pixel.b;
                    var newR = posterizeChannel(oldR, rBits);
                    var newG = posterizeChannel(oldG, gBits);
                    var newB = posterizeChannel(oldB, bBits);

                    // Set the pixel value to the posterized color
                    outputData.data[index] = newR;
                    outputData.data[index + 1] = newG;
                    outputData.data[index + 2] = newB;
                    outputData.data[index + 3] = 255;

                    // Calculate errors
                    var errorR = oldR - newR;
                    var errorG = oldG - newG;
                    var errorB = oldB - newB;

                    // Distribute the errors using Floyd-Steinberg matrix
                    distributeError(x + 1, y, errorR, errorG, errorB, 7);
                    distributeError(x - 1, y + 1, errorR, errorG, errorB, 3);
                    distributeError(x, y + 1, errorR, errorG, errorB, 5);
                    distributeError(x + 1, y + 1, errorR, errorG, errorB, 1);
                }
            }
        }

    }
    imageproc.errorDitherMultiThread = async function (inputData, outputData, type, color) {
        console.log("multithreading");
        var rBits = parseInt($("#error-red-bits").val());
        var gBits = parseInt($("#error-green-bits").val());
        var bBits = parseInt($("#error-blue-bits").val());
        //get errordither-thread's value
        var numWorkers =  parseInt($("#errordither-thread").val());
        const worker = [];
        function createWorkers(numWorkers, workerScript, callback) {
            var workers = [];
            var results = new Array(numWorkers).fill(null); // Initialize results with nulls
            var remaining = numWorkers;

            for (let i = 0; i < numWorkers; i++) {
                workers[i] = new Worker(workerScript);
                workers.push(workers[i]);
                workers[i].onmessage = function (e) {
                    results[e.data.index] = new Uint8ClampedArray(e.data.result);
                    remaining--;
                    if (remaining === 0) {
                        callback(results);
                    }
                };
            }

            return workers;
        }

        // Divide input data into chunks
        function divideImageData(data, width, height, numParts) {
            var parts = [];
            var partHeight = Math.ceil(height / numParts);

            for (var i = 0; i < numParts; i++) {
                var start = i * partHeight * width * 4;
                var end = Math.min((i + 1) * partHeight * width * 4, data.length);
                parts.push(data.slice(start, end));
            }

            return parts;
        }

        function mergeImageData(chunks, outputData, width, height, partHeight) {
            for (var i = 0; i < chunks.length; i++) {

                var chunk = chunks[i];
                var startY = i * partHeight;
                var offset = startY * width * 4;
                for (var j = 0; j < chunk.length; j++) {
                    outputData[offset + j] = chunk[j];
                }
            }
        }

        // Wrap callback-based worker handling into a Promise
        function runWorkersWithPromise(numWorkers, workerScript, parts, rBits, gBits, bBits, width, partHeight) {
            return new Promise((resolve) => {
                var workers = createWorkers(numWorkers, workerScript, function (results) {
                    resolve(results);
                });

                // Send work to each worker
                for (var i = 0; i < numWorkers; i++) {
                    workers[i].postMessage({
                        index: i,
                        inputData: {
                            data: parts[i],
                            width: width,
                            height: partHeight
                        },
                        rBits, gBits, bBits, type, color
                    });
                }
            });
        }

        for (var i = 0; i < inputData.data.length; i++) {
            outputData.data[i] = inputData.data[i];
        }

        // Divide the input data
        var partHeight = Math.ceil(inputData.height / numWorkers);
        var parts = divideImageData(inputData.data, inputData.width, inputData.height, numWorkers);

        // Run workers and wait for them to finish
        var results = await runWorkersWithPromise(
            numWorkers,
            './js/worker.js',
            parts,
            rBits,
            gBits,
            bBits,
            inputData.width,
            partHeight
        );

        mergeImageData(results, outputData.data, inputData.width, inputData.height, partHeight);

    };

}(window.imageproc = window.imageproc || {}));
