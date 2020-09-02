/* eslint-disable @typescript-eslint/no-empty-function */
/**
 * JavaScript project for accessing and normalizing the accelerometer and gyroscope data on mobile devices
 *
 * @author Doruk Eker <doruk@dorukeker.com>
 * @copyright Doruk Eker <http://dorukeker.com>
 * @version 2.0.6
 * @license MIT License | http://opensource.org/licenses/MIT
 */

(function (root, factory) {
  const e = {
    GyroNorm: factory(),
  };
  if (typeof define === 'function' && define.amd) {
    define(() => {
      return e;
    });
  } else if (typeof module === 'object' && module.exports) {
    module.exports = e;
  } else {
    root.GyroNorm = e.GyroNorm;
  }
})(this, () => {
  /* Constants */
  const GAME = 'game';
  const WORLD = 'world';
  const DEVICE_ORIENTATION = 'deviceorientation';
  const ACCELERATION = 'acceleration';
  const ACCELERATION_INCLUDING_GRAVITY = 'accelerationinludinggravity';
  const ROTATION_RATE = 'rotationrate';

  /*-------------------------------------------------------*/
  /* PRIVATE VARIABLES */

  let _interval = null; // Timer to return values
  let _isCalibrating = false; // Flag if calibrating
  let _calibrationValue = 0; // Alpha offset value
  let _gravityCoefficient = 0; // Coefficient to normalze gravity related values
  let _isRunning = false; // Boolean value if GyroNorm is tracking
  let _isReady = false; // Boolean value if GyroNorm is is initialized

  let _do = null; // Object to store the device orientation values
  let _dm = null; // Object to store the device motion values

  /* OPTIONS */
  let _frequency = 50; // Frequency for the return data in milliseconds
  let _gravityNormalized = true; // Flag if to normalize gravity values
  let _orientationBase = GAME; // Can be GyroNorm.GAME or GyroNorm.WORLD. GyroNorm.GAME returns orientation values with respect to the head direction of the device. GyroNorm.WORLD returns the orientation values with respect to the actual north direction of the world.
  let _decimalCount = 2; // Number of digits after the decimals point for the return values
  let _logger = null; // Function to callback on error. There is no default value. It can only be set by the user on gn.init()
  let _screenAdjusted = false; // If set to true it will return screen adjusted values. (e.g. On a horizontal orientation of a mobile device, the head would be one of the sides, instead of  the actual head of the device.)

  const _values = {
    do: {
      alpha: 0,
      beta: 0,
      gamma: 0,
      absolute: false,
    },
    dm: {
      x: 0,
      y: 0,
      z: 0,
      gx: 0,
      gy: 0,
      gz: 0,
      alpha: 0,
      beta: 0,
      gamma: 0,
    },
  };

  /*-------------------------------------------------------*/
  /* PUBLIC FUNCTIONS */

  /*
   *
   * Constructor function
   *
   */

  const GyroNorm = function (options) {};

  /* Constants */
  GyroNorm.GAME = GAME;
  GyroNorm.WORLD = WORLD;
  GyroNorm.DEVICE_ORIENTATION = DEVICE_ORIENTATION;
  GyroNorm.ACCELERATION = ACCELERATION;
  GyroNorm.ACCELERATION_INCLUDING_GRAVITY = ACCELERATION_INCLUDING_GRAVITY;
  GyroNorm.ROTATION_RATE = ROTATION_RATE;

  /*
   *
   * Initialize GyroNorm instance function
   *
   * @param object options - values are as follows. If set in the init function they overwrite the default option values
   * @param int options.frequency
   * @param boolean options.gravityNormalized
   * @param boolean options.orientationBase
   * @param boolean options.decimalCount
   * @param function options.logger
   * @param function options.screenAdjusted
   *
   */

  GyroNorm.prototype.init = function (options) {
    // Assign options that are passed with the constructor function
    if (options && options.frequency) {
      _frequency = options.frequency;
    }
    if (options && typeof options.gravityNormalized === 'boolean') {
      _gravityNormalized = options.gravityNormalized;
    }
    if (options && options.orientationBase) {
      _orientationBase = options.orientationBase;
    }
    if (
      options &&
      typeof options.decimalCount === 'number' &&
      options.decimalCount >= 0
    ) {
      _decimalCount = parseInt(options.decimalCount);
    }
    if (options && options.logger) {
      _logger = options.logger;
    }
    if (options && options.screenAdjusted) {
      _screenAdjusted = options.screenAdjusted;
    }

    const deviceOrientationPromise = this.FULLTILT.getDeviceOrientation({
      'type': _orientationBase,
    }).then((controller) => {
      _do = controller;
    });

    const deviceMotionPromise = this.FULLTILT.getDeviceMotion().then(
      (controller) => {
        _dm = controller;
        // Set gravity coefficient
        _gravityCoefficient =
          _dm.getScreenAdjustedAccelerationIncludingGravity().z > 0 ? -1 : 1;
      }
    );

    return Promise.all([deviceOrientationPromise, deviceMotionPromise]).then(
      () => {
        _isReady = true;
      }
    );
  };

  /*
   *
   * Stops all the tracking and listening on the window objects
   *
   */
  GyroNorm.prototype.end = function () {
    try {
      _isReady = false;
      this.stop();
      _dm.stop();
      _do.stop();
    } catch (err) {
      log(err);
    }
  };

  /*
   *
   * Starts tracking the values
   *
   * @param function callback - Callback function to read the values
   *
   */
  GyroNorm.prototype.start = function (callback) {
    if (!_isReady) {
      log({
        message:
          'GyroNorm is not initialized yet. First call the "init()" function.',
        code: 1,
      });
      return;
    }

    _interval = setInterval(() => {
      callback(snapShot());
    }, _frequency);
    _isRunning = true;
  };

  /*
   *
   * Stops tracking the values
   *
   */
  GyroNorm.prototype.stop = function () {
    if (_interval) {
      clearInterval(_interval);
      _isRunning = false;
    }
  };

  /*
   *
   * Toggles if to normalize gravity related values
   *
   * @param boolean flag
   *
   */
  GyroNorm.prototype.normalizeGravity = function (flag) {
    _gravityNormalized = flag ? true : false;
  };

  /*
   *
   * Sets the current head direction as alpha = 0
   * Can only be used if device orientation is being tracked, values are not screen adjusted, value type is GyroNorm.EULER and orientation base is GyroNorm.GAME
   *
   * @return: If head direction is set successfully returns true, else false
   *
   */
  GyroNorm.prototype.setHeadDirection = function () {
    if (_screenAdjusted || _orientationBase === WORLD) {
      return false;
    }

    _calibrationValue = _do.getFixedFrameEuler().alpha;
    return true;
  };

  /*
   *
   * Sets the log function
   *
   */
  GyroNorm.prototype.startLogging = function (logger) {
    if (logger) {
      _logger = logger;
    }
  };

  /*
   *
   * Sets the log function to null which stops the logging
   *
   */
  GyroNorm.prototype.stopLogging = function () {
    _logger = null;
  };

  /*
   *
   * Returns if certain type of event is available on the device
   *
   * @param string _eventType - possible values are "deviceorientation" , "devicemotion" , "compassneedscalibration"
   *
   * @return true if event is available false if not
   *
   */
  GyroNorm.prototype.isAvailable = function (_eventType) {
    const doSnapShot = _do.getScreenAdjustedEuler();
    const accSnapShot = _dm.getScreenAdjustedAcceleration();
    const accGraSnapShot = _dm.getScreenAdjustedAccelerationIncludingGravity();
    const rotRateSnapShot = _dm.getScreenAdjustedRotationRate();

    switch (_eventType) {
      case DEVICE_ORIENTATION:
        return (
          doSnapShot.alpha &&
          doSnapShot.alpha !== null &&
          doSnapShot.beta &&
          doSnapShot.beta !== null &&
          doSnapShot.gamma &&
          doSnapShot.gamma !== null
        );
      case ACCELERATION:
        return accSnapShot && accSnapShot.x && accSnapShot.y && accSnapShot.z;

      case ACCELERATION_INCLUDING_GRAVITY:
        return (
          accGraSnapShot &&
          accGraSnapShot.x &&
          accGraSnapShot.y &&
          accGraSnapShot.z
        );

      case ROTATION_RATE:
        return (
          rotRateSnapShot &&
          rotRateSnapShot.alpha &&
          rotRateSnapShot.beta &&
          rotRateSnapShot.gamma
        );

      default:
        return {
          deviceOrientationAvailable:
            doSnapShot.alpha &&
            doSnapShot.alpha !== null &&
            doSnapShot.beta &&
            doSnapShot.beta !== null &&
            doSnapShot.gamma &&
            doSnapShot.gamma !== null,
          accelerationAvailable:
            accSnapShot && accSnapShot.x && accSnapShot.y && accSnapShot.z,
          accelerationIncludingGravityAvailable:
            accGraSnapShot &&
            accGraSnapShot.x &&
            accGraSnapShot.y &&
            accGraSnapShot.z,
          rotationRateAvailable:
            rotRateSnapShot &&
            rotRateSnapShot.alpha &&
            rotRateSnapShot.beta &&
            rotRateSnapShot.gamma,
        };
    }
  };

  /*
   *
   * Returns boolean value if the GyroNorm is running
   *
   */
  GyroNorm.prototype.isRunning = function () {
    return _isRunning;
  };

  /*-------------------------------------------------------*/
  /* PRIVATE FUNCTIONS */

  /*
   *
   * Utility function to round with digits after the decimal point
   *
   * @param float number - the original number to round
   *
   */
  /**
   * @param number
   */
  function rnd(number) {
    return (
      Math.round(number * Math.pow(10, _decimalCount)) /
      Math.pow(10, _decimalCount)
    );
  }

  /*
   *
   * Starts calibration
   *
   */
  /**
   *
   */
  function calibrate() {
    _isCalibrating = true;
    _calibrationValue = [];
  }

  /*
   *
   * Takes a snapshot of the current deviceo orientaion and device motion values
   *
   */
  /**
   *
   */
  function snapShot() {
    let doSnapShot = {};

    if (_screenAdjusted) {
      doSnapShot = _do.getScreenAdjustedEuler();
    } else {
      doSnapShot = _do.getFixedFrameEuler();
    }

    const accSnapShot = _dm.getScreenAdjustedAcceleration();
    const accGraSnapShot = _dm.getScreenAdjustedAccelerationIncludingGravity();
    const rotRateSnapShot = _dm.getScreenAdjustedRotationRate();

    let alphaToSend = 0;

    if (_orientationBase === GAME) {
      alphaToSend = doSnapShot.alpha - _calibrationValue;
      alphaToSend = alphaToSend < 0 ? 360 - Math.abs(alphaToSend) : alphaToSend;
    } else {
      alphaToSend = doSnapShot.alpha;
    }

    const snapShot = {
      do: {
        alpha: rnd(alphaToSend),
        beta: rnd(doSnapShot.beta),
        gamma: rnd(doSnapShot.gamma),
        absolute: _do.isAbsolute(),
      },
      dm: {
        x: rnd(accSnapShot.x),
        y: rnd(accSnapShot.y),
        z: rnd(accSnapShot.z),
        gx: rnd(accGraSnapShot.x),
        gy: rnd(accGraSnapShot.y),
        gz: rnd(accGraSnapShot.z),
        alpha: rnd(rotRateSnapShot.alpha),
        beta: rnd(rotRateSnapShot.beta),
        gamma: rnd(rotRateSnapShot.gamma),
      },
    };

    // Normalize gravity
    if (_gravityNormalized) {
      snapShot.dm.gx *= _gravityCoefficient;
      snapShot.dm.gy *= _gravityCoefficient;
      snapShot.dm.gz *= _gravityCoefficient;
      snapShot.dm.x *= _gravityCoefficient;
      snapShot.dm.y *= _gravityCoefficient;
      snapShot.dm.z *= _gravityCoefficient;
    }

    return snapShot;
  }

  /*
   *
   * Starts listening to orientation event on the window object
   *
   */
  /**
   * @param err
   */
  function log(err) {
    if (_logger) {
      if (typeof err == 'string') {
        err = {message: err, code: 0};
      }
      _logger(err);
    }
  }

  return GyroNorm;
});
