(function (imageproc) {
  "use strict";
  /*
   * Apply negation to the input data
   */
  imageproc.negation = function (inputData, outputData) {
    console.log("Applying negation...");

    for (var i = 0; i < inputData.data.length; i += 4) {
      outputData.data[i] = 255 - inputData.data[i];
      outputData.data[i + 1] = 255 - inputData.data[i + 1];
      outputData.data[i + 2] = 255 - inputData.data[i + 2];
    }
  };
  function bound(value) {
    value = parseInt(value);
    if (value > 255) {
      return 255;
    } else if (value < 0) {
      return 0;
    } else {
      return value;
    }
  }

  /*
   * Convert the input data to grayscale
   */
  imageproc.grayscale = function (inputData, outputData) {
    console.log("Applying grayscale...");

    /**
     * TODO: You need to create the grayscale operation here
     */

    for (var i = 0; i < inputData.data.length; i += 4) {
      // Find the grayscale value using simple averaging

      // Change the RGB components to the resulting value
      var s =
        (inputData.data[i] + inputData.data[i + 1] + inputData.data[i + 2]) / 3;
      outputData.data[i] = s;
      outputData.data[i + 1] = s;
      outputData.data[i + 2] = s;
    }
  };

  /*
   * Applying brightness to the input data
   */
  imageproc.brightness = function (inputData, outputData, offset) {
    console.log("Applying brightness...");

    /**
     * TODO: You need to create the brightness operation here
     */

    for (var i = 0; i < inputData.data.length; i += 4) {
      // Change the RGB components by adding an offset

      outputData.data[i] = bound(inputData.data[i] + offset);
      outputData.data[i + 1] = bound(inputData.data[i + 1] + offset);
      outputData.data[i + 2] = bound(inputData.data[i + 2] + offset);

      // Handle clipping of the RGB components
    }
  };

  /*
   * Applying contrast to the input data
   */
  imageproc.contrast = function (inputData, outputData, factor) {
    console.log("Applying contrast...");

    /**
     * TODO: You need to create the brightness operation here
     */

    for (var i = 0; i < inputData.data.length; i += 4) {
      // Change the RGB components by multiplying a factor

      outputData.data[i] = bound(inputData.data[i] * factor);
      outputData.data[i + 1] = bound(inputData.data[i + 1] * factor);
      outputData.data[i + 2] = bound(inputData.data[i + 2] * factor);

      // Handle clipping of the RGB components
    }
  };

  /*
   * Make a bit mask based on the number of MSB required
   */
  function makeBitMask(bits) {
    var mask = 0;
    for (var i = 0; i < bits; i++) {
      mask >>= 1;
      mask |= 128;
    }
    return mask;
  }

  /*
   * Apply posterization to the input data
   */
  imageproc.posterization = function (
    inputData,
    outputData,
    redBits,
    greenBits,
    blueBits
  ) {
    console.log("Applying posterization...");

    /**
     * TODO: You need to create the posterization operation here
     */

    // Create the red, green and blue masks
    // A function makeBitMask() is already given

    for (var i = 0; i < inputData.data.length; i += 4) {
      // Apply the bitmasks onto the RGB channels
      outputData.data[i] = inputData.data[i] & makeBitMask(redBits);
      outputData.data[i + 1] = inputData.data[i + 1] & makeBitMask(greenBits);
      outputData.data[i + 2] = inputData.data[i + 2] & makeBitMask(blueBits);
    }
  };

  /*
   * Apply threshold to the input data
   */
  imageproc.threshold = function (inputData, outputData, thresholdValue) {
    console.log("Applying thresholding...?");

    /**
     * TODO: You need to create the thresholding operation here
     */

    for (var i = 0; i < inputData.data.length; i += 4) {
      // Find the grayscale value using simple averaging
      // You will apply thresholding on the grayscale value

      // Change the colour to black or white based on the given threshold

      var s =
        (inputData.data[i] + inputData.data[i + 1] + inputData.data[i + 2]) / 3;
      outputData.data[i] = s < thresholdValue ? 0 : 255;
      outputData.data[i + 1] = s < thresholdValue ? 0 : 255;
      outputData.data[i + 2] = s < thresholdValue ? 0 : 255;
    }
  };

  /*
   * Build the histogram of the image for a channel
   */
  function buildHistogram(inputData, channel) {
    var histogram = [];
    for (var i = 0; i < 256; i++) histogram[i] = 0;

    /**
     * TODO: You need to build the histogram here
     */
    if (channel == "gray") {
      // Grayscale - average of RGB components
      for (var i = 0; i < inputData.data.length; i += 4) {
        var gray =
          (inputData.data[i] + inputData.data[i + 1] + inputData.data[i + 2]) /
          3;
        histogram[Math.floor(gray)] += 1;
      }
    } else if (channel == "red") {
      // Red channel
      for (var i = 0; i < inputData.data.length; i += 4) {
        var red = inputData.data[i];
        histogram[red] += 1;
      }
    } else if (channel == "green") {
      // Green channel
      for (var i = 0; i < inputData.data.length; i += 4) {
        var green = inputData.data[i + 1];
        histogram[green] += 1;
      }
    } else if (channel == "blue") {
      // Blue channel
      for (var i = 0; i < inputData.data.length; i += 4) {
        var blue = inputData.data[i + 2];
        histogram[blue] += 1;
      }
    }
    return histogram;
  }

  function helper(c, min, max) {
    c = ((c - min) / (max - min)) * 255;
    c = Math.max(0, Math.min(255, c)); // Clipping to the range [0, 255]
    return c;
  }
  /*
   * Find the min and max of the histogram
   */
  function findMinMax(histogram, pixelsToIgnore) {
    let cumulativePixels = 0;
    let min = 0;
    let max = 255;

    // Find the new minimum
    for (; min <= 255; min++) {
      cumulativePixels += histogram[min];
      if (cumulativePixels > pixelsToIgnore) {
        break; // Found the new minimum
      }
    }

    // Reset for finding the maximum
    cumulativePixels = 0;

    // Find the new maximum
    for (; max >= 0; max--) {
      cumulativePixels += histogram[max];
      if (cumulativePixels > pixelsToIgnore) {
        break; // Found the new maximum
      }
    }

    return { min, max };
  }

  /*
   * Apply automatic contrast to the input data
   */
  imageproc.autoContrast = function (inputData, outputData, type, percentage) {
    console.log("Applying automatic contrast...");

    // Find the number of pixels to ignore from the percentage
    var pixelsToIgnore = (inputData.data.length / 4) * percentage;
    var histogram, minMax;
    if (type == "gray") {
      // Build the grayscale histogram
      histogram = buildHistogram(inputData, "gray");
      console.log(histogram.slice(0, 10).join(","));
      // Find the minimum and maximum grayscale values with non-zero pixels
      minMax = findMinMax(histogram, pixelsToIgnore);

      var min = minMax.min,
        max = minMax.max,
        range = max - min;
      console.log(minMax.min, minMax.max);
      /**
       * TODO: You need to apply the correct adjustment to each pixel
       */

      for (var i = 0; i < inputData.data.length; i += 4) {
        // Adjust each pixel based on the minimum and maximum values

        outputData.data[i] = helper(inputData.data[i], minMax.min, minMax.max);
        outputData.data[i + 1] = helper(inputData.data[i+1], minMax.min, minMax.max);
        outputData.data[i + 2] = helper(inputData.data[i+2], minMax.min, minMax.max);
      }
    } else {
      /**
       * TODO: You need to apply the same procedure for each RGB channel
       *       based on what you have done for the grayscale version
       */
      ["red", "green", "blue"].forEach((channel, idx) => {
        var histogram = buildHistogram(inputData, channel);
        var minMax = findMinMax(histogram, pixelsToIgnore);

        for (var i = 0; i < inputData.data.length; i += 4) {
          outputData.data[i + idx] = helper(
            inputData.data[i + idx],
            minMax.min,
            minMax.max
          );
        }
      });
    }
    }
  }
)((window.imageproc = window.imageproc || {}));
