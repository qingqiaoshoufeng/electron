/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ "./node_modules/args/lib/command.js":
/*!******************************************!*\
  !*** ./node_modules/args/lib/command.js ***!
  \******************************************/
/***/ ((module) => {

"use strict";


module.exports = function(usage, description, init, aliases) {
  if (Array.isArray(init)) {
    aliases = init
    init = undefined
  }

  if (aliases && Array.isArray(aliases)) {
    usage = [].concat([usage], aliases)
  }

  // Register command to global scope
  this.details.commands.push({
    usage,
    description,
    init: typeof init === 'function' ? init : false
  })

  // Allow chaining of .command()
  return this
}


/***/ }),

/***/ "./node_modules/args/lib/example.js":
/*!******************************************!*\
  !*** ./node_modules/args/lib/example.js ***!
  \******************************************/
/***/ ((module) => {

"use strict";


module.exports = function(usage, description) {
  if (typeof usage !== 'string' || typeof description !== 'string') {
    throw new TypeError(
      'Usage for adding an Example: args.example("usage", "description")'
    )
  }

  this.details.examples.push({ usage, description })

  return this
}


/***/ }),

/***/ "./node_modules/args/lib/examples.js":
/*!*******************************************!*\
  !*** ./node_modules/args/lib/examples.js ***!
  \*******************************************/
/***/ ((module) => {

"use strict";


module.exports = function(list) {
  if (list.constructor !== Array) {
    throw new Error('Item passed to .examples is not an array')
  }

  for (const item of list) {
    const usage = item.usage || false
    const description = item.description || false
    this.example(usage, description)
  }

  return this
}


/***/ }),

/***/ "./node_modules/args/lib/help.js":
/*!***************************************!*\
  !*** ./node_modules/args/lib/help.js ***!
  \***************************************/
/***/ ((module) => {

"use strict";


module.exports = function() {
  const name = this.config.name || this.binary.replace('-', ' ')
  const capitalize = word => word.charAt(0).toUpperCase() + word.substr(1)

  const parts = []

  const groups = {
    commands: true,
    options: true,
    examples: true
  }

  for (const group in groups) {
    if (this.details[group].length > 0) {
      continue
    }

    groups[group] = false
  }

  const optionHandle = groups.options ? '[options] ' : ''
  const cmdHandle = groups.commands ? '[command]' : ''
  const value =
    typeof this.config.value === 'string' ? ' ' + this.config.value : ''

  parts.push([
    `  Usage: ${this.printMainColor(name)} ${this.printSubColor(
      optionHandle + cmdHandle + value
    )}`,
    ''
  ])

  for (const group in groups) {
    if (!groups[group]) {
      continue
    }

    parts.push(['', capitalize(group) + ':', ''])

    if (group === 'examples') {
      parts.push(this.generateExamples())
    } else {
      parts.push(this.generateDetails(group))
    }

    parts.push(['', ''])
  }

  let output = ''

  // And finally, merge and output them
  for (const part of parts) {
    output += part.join('\n  ')
  }

  if (!groups.commands && !groups.options) {
    output = 'No sub commands or options available'
  }

  const { usageFilter } = this.config

  // If filter is available, pass usage information through
  if (typeof usageFilter === 'function') {
    output = usageFilter(output) || output
  }

  console.log(output)

  if (this.config.exit && this.config.exit.help) {
    // eslint-disable-next-line unicorn/no-process-exit
    process.exit()
  }
}


/***/ }),

/***/ "./node_modules/args/lib/index.js":
/*!****************************************!*\
  !*** ./node_modules/args/lib/index.js ***!
  \****************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


const chalk = __webpack_require__(/*! chalk */ "./node_modules/args/node_modules/chalk/index.js")
const utils = __webpack_require__(/*! ./utils */ "./node_modules/args/lib/utils.js")

const publicMethods = {
  option: __webpack_require__(/*! ./option */ "./node_modules/args/lib/option.js"),
  options: __webpack_require__(/*! ./options */ "./node_modules/args/lib/options.js"),
  command: __webpack_require__(/*! ./command */ "./node_modules/args/lib/command.js"),
  parse: __webpack_require__(/*! ./parse */ "./node_modules/args/lib/parse.js"),
  example: __webpack_require__(/*! ./example */ "./node_modules/args/lib/example.js"),
  examples: __webpack_require__(/*! ./examples */ "./node_modules/args/lib/examples.js"),
  showHelp: __webpack_require__(/*! ./help */ "./node_modules/args/lib/help.js"),
  showVersion: __webpack_require__(/*! ./version */ "./node_modules/args/lib/version.js")
}

function Args() {
  this.details = {
    options: [],
    commands: [],
    examples: []
  }

  // Configuration defaults
  this.config = {
    exit: { help: true, version: true },
    help: true,
    version: true,
    usageFilter: null,
    value: null,
    name: null,
    mainColor: 'yellow',
    subColor: 'dim'
  }

  this.printMainColor = chalk
  this.printSubColor = chalk
}

// Assign internal helpers
for (const util in utils) {
  if (!{}.hasOwnProperty.call(utils, util)) {
    continue
  }

  Args.prototype[util] = utils[util]
}

// Assign public methods
for (const method in publicMethods) {
  if (!{}.hasOwnProperty.call(publicMethods, method)) {
    continue
  }

  Args.prototype[method] = publicMethods[method]
}

module.exports = new Args()
module.exports.Args = Args;


/***/ }),

/***/ "./node_modules/args/lib/option.js":
/*!*****************************************!*\
  !*** ./node_modules/args/lib/option.js ***!
  \*****************************************/
/***/ ((module) => {

"use strict";


module.exports = function(name, description, defaultValue, init) {
  let usage = []

  const assignShort = (name, options, short) => {
    if (options.find(flagName => flagName.usage[0] === short)) {
      short = name.charAt(0).toUpperCase()
    }

    return [short, name]
  }

  // If name is an array, pick the values
  // Otherwise just use the whole thing
  switch (name.constructor) {
    case String:
      usage = assignShort(name, this.details.options, name.charAt(0))
      break
    case Array:
      usage = usage.concat(name)
      break
    default:
      throw new Error('Invalid name for option')
  }

  // Throw error if short option is too long
  if (usage.length > 0 && usage[0].length > 1) {
    throw new Error('Short version of option is longer than 1 char')
  }

  const optionDetails = {
    defaultValue,
    usage,
    description
  }

  let defaultIsWrong

  switch (defaultValue) {
    case false:
      defaultIsWrong = true
      break
    case null:
      defaultIsWrong = true
      break
    case undefined:
      defaultIsWrong = true
      break
    default:
      defaultIsWrong = false
  }

  if (typeof init === 'function') {
    optionDetails.init = init
  } else if (!defaultIsWrong) {
    // Set initializer depending on type of default value
    optionDetails.init = this.handleType(defaultValue)[1]
  }

  // Register option to global scope
  this.details.options.push(optionDetails)

  // Allow chaining of .option()
  return this
}


/***/ }),

/***/ "./node_modules/args/lib/options.js":
/*!******************************************!*\
  !*** ./node_modules/args/lib/options.js ***!
  \******************************************/
/***/ ((module) => {

"use strict";


module.exports = function(list) {
  if (list.constructor !== Array) {
    throw new Error('Item passed to .options is not an array')
  }

  for (const item of list) {
    const preset = item.defaultValue
    const init = item.init || false

    this.option(item.name, item.description, preset, init)
  }

  return this
}


/***/ }),

/***/ "./node_modules/args/lib/parse.js":
/*!****************************************!*\
  !*** ./node_modules/args/lib/parse.js ***!
  \****************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


const path = __webpack_require__(/*! path */ "path")
const parser = __webpack_require__(/*! mri */ "./node_modules/mri/lib/index.js")

module.exports = function(argv, options) {
  // Override default option values
  Object.assign(this.config, options)

  if (Array.isArray(this.config.mainColor)) {
    for (const item in this.config.mainColor) {
      if (!{}.hasOwnProperty.call(this.config.mainColor, item)) {
        continue
      }

      // Chain all colors to our print method
      this.printMainColor = this.printMainColor[this.config.mainColor[item]]
    }
  } else {
    this.printMainColor = this.printMainColor[this.config.mainColor]
  }

  if (Array.isArray(this.config.subColor)) {
    for (const item in this.config.subColor) {
      if (!{}.hasOwnProperty.call(this.config.subColor, item)) {
        continue
      }

      // Chain all colors to our print method
      this.printSubColor = this.printSubColor[this.config.subColor[item]]
    }
  } else {
    this.printSubColor = this.printSubColor[this.config.subColor]
  }

  // Parse arguments using mri
  this.raw = parser(argv.slice(1), this.config.mri || this.config.minimist)
  this.binary = path.basename(this.raw._[0])

  // If default version is allowed, check for it
  if (this.config.version) {
    this.checkVersion()
  }

  // If default help is allowed, check for it
  if (this.config.help) {
    this.checkHelp()
  }

  const subCommand = this.raw._[1]
  const args = {}
  const defined = this.isDefined(subCommand, 'commands')
  const optionList = this.getOptions(defined)

  Object.assign(args, this.raw)
  args._.shift()

  // Export sub arguments of command
  this.sub = args._

  // If sub command is defined, run it
  if (defined) {
    this.runCommand(defined, optionList)
    return {}
  }

  // Hand back list of options
  return optionList
}


/***/ }),

/***/ "./node_modules/args/lib/utils.js":
/*!****************************************!*\
  !*** ./node_modules/args/lib/utils.js ***!
  \****************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


const { spawn } = __webpack_require__(/*! child_process */ "child_process")
const path = __webpack_require__(/*! path */ "path")
const camelcase = __webpack_require__(/*! camelcase */ "./node_modules/camelcase/index.js")
const leven = __webpack_require__(/*! leven */ "./node_modules/leven/index.js")

function similarityBestMatch(mainString, targetStrings) {
  let bestMatch
  const ratings = targetStrings.map(targetString => {
    const score = leven(mainString, targetString)

    const res = {
      target: targetString,
      rating: leven(mainString, targetString)
    }

    if (!bestMatch || score < bestMatch.rating) bestMatch = res

    return res
  })

  return {
    ratings,
    bestMatch
  }
}

module.exports = {
  handleType(value) {
    let type = value
    if (typeof value !== 'function') {
      type = value.constructor
    }

    // Depending on the type of the default value,
    // select a default initializer function
    switch (type) {
      case String:
        return ['[value]']
      case Array:
        return ['<list>']
      case Number:
      case parseInt:
        return ['<n>', parseInt]
      default:
        return ['']
    }
  },

  readOption(option) {
    let value = option.defaultValue
    const contents = {}

    // If option has been used, get its value
    for (const name of option.usage) {
      const fromArgs = this.raw[name]
      if (typeof fromArgs !== 'undefined') {
        value = fromArgs
        break
      }
    }

    // Process the option's value
    for (let name of option.usage) {
      let propVal = value

      // Convert the value to an array when the option is called just once
      if (
        Array.isArray(option.defaultValue) &&
        typeof propVal !== typeof option.defaultValue
      ) {
        propVal = [propVal]
      }

      if (
        typeof option.defaultValue !== 'undefined' &&
        typeof propVal !== typeof option.defaultValue
      ) {
        propVal = option.defaultValue
      }

      let condition = true

      if (option.init) {
        // Only use the toString initializer if value is a number
        if (option.init === toString) {
          condition = propVal.constructor === Number
        }

        if (condition) {
          // Pass it through the initializer
          propVal = option.init(propVal)
        }
      }

      // Camelcase option name (skip short flag)
      if (name.length > 1) {
        name = camelcase(name)
      }

      // Add option to list
      contents[name] = propVal
    }

    return contents
  },

  getOptions(definedSubcommand) {
    const options = {}
    const args = {}

    // Copy over the arguments
    Object.assign(args, this.raw)
    delete args._

    // Set option defaults
    for (const option of this.details.options) {
      if (typeof option.defaultValue === 'undefined') {
        continue
      }

      Object.assign(options, this.readOption(option))
    }

    // Override defaults if used in command line
    for (const option in args) {
      if (!{}.hasOwnProperty.call(args, option)) {
        continue
      }

      const related = this.isDefined(option, 'options')

      if (related) {
        const details = this.readOption(related)
        Object.assign(options, details)
      }

      if (!related && !definedSubcommand) {
        // Unknown Option
        const availableOptions = []
        this.details.options.forEach(opt => {
          availableOptions.push(...opt.usage)
        })

        const suggestOption = similarityBestMatch(option, availableOptions)

        process.stdout.write(`The option "${option}" is unknown.`)

        if (suggestOption.bestMatch.rating >= 0.5) {
          process.stdout.write(' Did you mean the following one?\n')

          const suggestion = this.details.options.filter(item => {
            for (const flag of item.usage) {
              if (flag === suggestOption.bestMatch.target) {
                return true
              }
            }

            return false
          })

          process.stdout.write(
            this.generateDetails(suggestion)[0].trim() + '\n'
          )

          // eslint-disable-next-line unicorn/no-process-exit
          process.exit()
        } else {
          process.stdout.write(` Here's a list of all available options: \n`)
          this.showHelp()
        }
      }
    }

    return options
  },

  generateExamples() {
    const { examples } = this.details
    const parts = []

    for (const item in examples) {
      if (!{}.hasOwnProperty.call(examples, item)) {
        continue
      }

      const usage = this.printSubColor('$ ' + examples[item].usage)
      const description = this.printMainColor('- ' + examples[item].description)
      parts.push(`  ${description}\n    ${usage}\n`)
    }

    return parts
  },

  generateDetails(kind) {
    // Get all properties of kind from global scope
    const items = []

    // Clone passed objects so changing them here doesn't affect real data.
    const passed = [].concat(
      typeof kind === 'string' ? this.details[kind] : kind
    )
    for (let i = 0, l = passed.length; i < l; i++) {
      items.push(Object.assign({}, passed[i]))
    }

    const parts = []
    const isCmd = kind === 'commands'

    // Sort items alphabetically
    items.sort((a, b) => {
      const first = isCmd ? a.usage : a.usage[1]
      const second = isCmd ? b.usage : b.usage[1]

      switch (true) {
        case first < second:
          return -1
        case first > second:
          return 1
        default:
          return 0
      }
    })

    for (const item in items) {
      if (!{}.hasOwnProperty.call(items, item)) {
        continue
      }

      let { usage } = items[item]
      let initial = items[item].defaultValue

      // If usage is an array, show its contents
      if (usage.constructor === Array) {
        if (isCmd) {
          usage = usage.join(', ')
        } else {
          const isVersion = usage.indexOf('v')
          usage = `-${usage[0]}, --${usage[1]}`

          if (!initial) {
            initial = items[item].init
          }

          usage +=
            initial && isVersion === -1 ? ' ' + this.handleType(initial)[0] : ''
        }
      }

      // Overwrite usage with readable syntax
      items[item].usage = usage
    }

    // Find length of longest option or command
    // Before doing that, make a copy of the original array
    const longest = items.slice().sort((a, b) => {
      return b.usage.length - a.usage.length
    })[0].usage.length

    for (const item of items) {
      let { usage, description, defaultValue } = item
      const difference = longest - usage.length

      // Compensate the difference to longest property with spaces
      usage += ' '.repeat(difference)

      // Add some space around it as well
      if (typeof defaultValue !== 'undefined') {
        if (typeof defaultValue === 'boolean') {
          description += ` (${
            defaultValue ? 'enabled' : 'disabled'
          } by default)`
        } else {
          description += ` (defaults to ${JSON.stringify(defaultValue)})`
        }
      }

      parts.push(
        '  ' +
          this.printMainColor(usage) +
          '  ' +
          this.printSubColor(description)
      )
    }

    return parts
  },

  runCommand(details, options) {
    // If help is disabled, remove initializer
    if (details.usage === 'help' && !this.config.help) {
      details.init = false
    }

    // If version is disabled, remove initializer
    if (details.usage === 'version' && !this.config.version) {
      details.init = false
    }

    // If command has initializer, call it
    if (details.init) {
      const sub = [].concat(this.sub)
      sub.shift()

      return details.init.bind(this)(details.usage, sub, options)
    }

    // Generate full name of binary
    const subCommand = Array.isArray(details.usage)
      ? details.usage[0]
      : details.usage
    let full = this.binary + '-' + subCommand

    // Remove node and original command.
    const args = process.argv.slice(2)

    // Remove the first occurance of subCommand from the args.
    for (let i = 0, l = args.length; i < l; i++) {
      if (args[i] === subCommand) {
        args.splice(i, 1)
        break
      }
    }

    if (process.platform === 'win32') {
      const binaryExt = path.extname(this.binary)
      const mainModule = process.env.APPVEYOR
        ? '_fixture'
        : process.mainModule.filename

      full = `${mainModule}-${subCommand}`

      if (path.extname(this.binary)) {
        full = `${mainModule.replace(binaryExt, '')}-${subCommand}${binaryExt}`
      }

      // Run binary of sub command on windows
      args.unshift(full)
      this.child = spawn(process.execPath, args, {
        stdio: 'inherit'
      })
    } else {
      // Run binary of sub command
      this.child = spawn(full, args, {
        stdio: 'inherit'
      })
    }

    // Throw an error if something fails within that binary
    this.child.on('error', err => {
      throw err
    })

    this.child.on('exit', (code, signal) => {
      process.on('exit', () => {
        this.child = null
        if (signal) {
          process.kill(process.pid, signal)
        } else {
          process.exit(code)
        }
      })
    })

    // Proxy SIGINT to child process
    process.on('SIGINT', () => {
      if (this.child) {
        this.child.kill('SIGINT')
        this.child.kill('SIGTERM') // If that didn't work, we're probably in an infinite loop, so make it die
      }
    })
  },

  checkHelp() {
    // Register default option and command.
    this.option('help', 'Output usage information')
    this.command('help', 'Display help', this.showHelp)

    // Immediately output if option was provided.
    if (this.optionWasProvided('help')) {
      this.showHelp()
    }
  },

  checkVersion() {
    // Register default option and command.
    this.option('version', 'Output the version number')
    this.command('version', 'Display version', this.showVersion)

    // Immediately output if option was provided.
    if (this.optionWasProvided('version')) {
      this.showVersion()
    }
  },

  isDefined(name, list) {
    // Get all items of kind
    const children = this.details[list]

    // Check if a child matches the requested name
    for (const child of children) {
      const { usage } = child
      const type = usage.constructor

      if (type === Array && usage.indexOf(name) > -1) {
        return child
      }

      if (type === String && usage === name) {
        return child
      }
    }

    // If nothing matches, item is not defined
    return false
  },

  optionWasProvided(name) {
    const option = this.isDefined(name, 'options')
    return option && (this.raw[option.usage[0]] || this.raw[option.usage[1]])
  }
}


/***/ }),

/***/ "./node_modules/args/lib/version.js":
/*!******************************************!*\
  !*** ./node_modules/args/lib/version.js ***!
  \******************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


const fs = __webpack_require__(/*! fs */ "fs")
const path = __webpack_require__(/*! path */ "path")

/**
 * Retrieves the main module package.json information.
 *
 * @param {string} directory
 *   The directory to start looking in.
 *
 * @return {Object|null}
 *   An object containing the package.json contents or NULL if it could not be found.
 */
function findPackage(directory) {
  const file = path.resolve(directory, 'package.json')
  if (fs.existsSync(file) && fs.statSync(file).isFile()) {
    return __webpack_require__("./node_modules/args/lib sync recursive")(file)
  }

  const parent = path.resolve(directory, '..')
  return parent === directory ? null : findPackage(parent)
}

module.exports = function() {
  const pkg = findPackage(path.dirname(process.mainModule.filename))
  const version = (pkg && pkg.version) || '-/-'

  console.log(version)

  if (this.config.exit && this.config.exit.version) {
    // eslint-disable-next-line unicorn/no-process-exit
    process.exit()
  }
}


/***/ }),

/***/ "./node_modules/args/lib sync recursive":
/*!*************************************!*\
  !*** ./node_modules/args/lib/ sync ***!
  \*************************************/
/***/ ((module) => {

function webpackEmptyContext(req) {
	var e = new Error("Cannot find module '" + req + "'");
	e.code = 'MODULE_NOT_FOUND';
	throw e;
}
webpackEmptyContext.keys = () => ([]);
webpackEmptyContext.resolve = webpackEmptyContext;
webpackEmptyContext.id = "./node_modules/args/lib sync recursive";
module.exports = webpackEmptyContext;

/***/ }),

/***/ "./node_modules/args/node_modules/ansi-styles/index.js":
/*!*************************************************************!*\
  !*** ./node_modules/args/node_modules/ansi-styles/index.js ***!
  \*************************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";
/* module decorator */ module = __webpack_require__.nmd(module);

const colorConvert = __webpack_require__(/*! color-convert */ "./node_modules/color-convert/index.js");

const wrapAnsi16 = (fn, offset) => function () {
	const code = fn.apply(colorConvert, arguments);
	return `\u001B[${code + offset}m`;
};

const wrapAnsi256 = (fn, offset) => function () {
	const code = fn.apply(colorConvert, arguments);
	return `\u001B[${38 + offset};5;${code}m`;
};

const wrapAnsi16m = (fn, offset) => function () {
	const rgb = fn.apply(colorConvert, arguments);
	return `\u001B[${38 + offset};2;${rgb[0]};${rgb[1]};${rgb[2]}m`;
};

function assembleStyles() {
	const codes = new Map();
	const styles = {
		modifier: {
			reset: [0, 0],
			// 21 isn't widely supported and 22 does the same thing
			bold: [1, 22],
			dim: [2, 22],
			italic: [3, 23],
			underline: [4, 24],
			inverse: [7, 27],
			hidden: [8, 28],
			strikethrough: [9, 29]
		},
		color: {
			black: [30, 39],
			red: [31, 39],
			green: [32, 39],
			yellow: [33, 39],
			blue: [34, 39],
			magenta: [35, 39],
			cyan: [36, 39],
			white: [37, 39],
			gray: [90, 39],

			// Bright color
			redBright: [91, 39],
			greenBright: [92, 39],
			yellowBright: [93, 39],
			blueBright: [94, 39],
			magentaBright: [95, 39],
			cyanBright: [96, 39],
			whiteBright: [97, 39]
		},
		bgColor: {
			bgBlack: [40, 49],
			bgRed: [41, 49],
			bgGreen: [42, 49],
			bgYellow: [43, 49],
			bgBlue: [44, 49],
			bgMagenta: [45, 49],
			bgCyan: [46, 49],
			bgWhite: [47, 49],

			// Bright color
			bgBlackBright: [100, 49],
			bgRedBright: [101, 49],
			bgGreenBright: [102, 49],
			bgYellowBright: [103, 49],
			bgBlueBright: [104, 49],
			bgMagentaBright: [105, 49],
			bgCyanBright: [106, 49],
			bgWhiteBright: [107, 49]
		}
	};

	// Fix humans
	styles.color.grey = styles.color.gray;

	for (const groupName of Object.keys(styles)) {
		const group = styles[groupName];

		for (const styleName of Object.keys(group)) {
			const style = group[styleName];

			styles[styleName] = {
				open: `\u001B[${style[0]}m`,
				close: `\u001B[${style[1]}m`
			};

			group[styleName] = styles[styleName];

			codes.set(style[0], style[1]);
		}

		Object.defineProperty(styles, groupName, {
			value: group,
			enumerable: false
		});

		Object.defineProperty(styles, 'codes', {
			value: codes,
			enumerable: false
		});
	}

	const ansi2ansi = n => n;
	const rgb2rgb = (r, g, b) => [r, g, b];

	styles.color.close = '\u001B[39m';
	styles.bgColor.close = '\u001B[49m';

	styles.color.ansi = {
		ansi: wrapAnsi16(ansi2ansi, 0)
	};
	styles.color.ansi256 = {
		ansi256: wrapAnsi256(ansi2ansi, 0)
	};
	styles.color.ansi16m = {
		rgb: wrapAnsi16m(rgb2rgb, 0)
	};

	styles.bgColor.ansi = {
		ansi: wrapAnsi16(ansi2ansi, 10)
	};
	styles.bgColor.ansi256 = {
		ansi256: wrapAnsi256(ansi2ansi, 10)
	};
	styles.bgColor.ansi16m = {
		rgb: wrapAnsi16m(rgb2rgb, 10)
	};

	for (let key of Object.keys(colorConvert)) {
		if (typeof colorConvert[key] !== 'object') {
			continue;
		}

		const suite = colorConvert[key];

		if (key === 'ansi16') {
			key = 'ansi';
		}

		if ('ansi16' in suite) {
			styles.color.ansi[key] = wrapAnsi16(suite.ansi16, 0);
			styles.bgColor.ansi[key] = wrapAnsi16(suite.ansi16, 10);
		}

		if ('ansi256' in suite) {
			styles.color.ansi256[key] = wrapAnsi256(suite.ansi256, 0);
			styles.bgColor.ansi256[key] = wrapAnsi256(suite.ansi256, 10);
		}

		if ('rgb' in suite) {
			styles.color.ansi16m[key] = wrapAnsi16m(suite.rgb, 0);
			styles.bgColor.ansi16m[key] = wrapAnsi16m(suite.rgb, 10);
		}
	}

	return styles;
}

// Make the export immutable
Object.defineProperty(module, 'exports', {
	enumerable: true,
	get: assembleStyles
});


/***/ }),

/***/ "./node_modules/args/node_modules/chalk/index.js":
/*!*******************************************************!*\
  !*** ./node_modules/args/node_modules/chalk/index.js ***!
  \*******************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";

const escapeStringRegexp = __webpack_require__(/*! escape-string-regexp */ "./node_modules/escape-string-regexp/index.js");
const ansiStyles = __webpack_require__(/*! ansi-styles */ "./node_modules/args/node_modules/ansi-styles/index.js");
const stdoutColor = (__webpack_require__(/*! supports-color */ "./node_modules/args/node_modules/supports-color/index.js").stdout);

const template = __webpack_require__(/*! ./templates.js */ "./node_modules/args/node_modules/chalk/templates.js");

const isSimpleWindowsTerm = process.platform === 'win32' && !(process.env.TERM || '').toLowerCase().startsWith('xterm');

// `supportsColor.level` → `ansiStyles.color[name]` mapping
const levelMapping = ['ansi', 'ansi', 'ansi256', 'ansi16m'];

// `color-convert` models to exclude from the Chalk API due to conflicts and such
const skipModels = new Set(['gray']);

const styles = Object.create(null);

function applyOptions(obj, options) {
	options = options || {};

	// Detect level if not set manually
	const scLevel = stdoutColor ? stdoutColor.level : 0;
	obj.level = options.level === undefined ? scLevel : options.level;
	obj.enabled = 'enabled' in options ? options.enabled : obj.level > 0;
}

function Chalk(options) {
	// We check for this.template here since calling `chalk.constructor()`
	// by itself will have a `this` of a previously constructed chalk object
	if (!this || !(this instanceof Chalk) || this.template) {
		const chalk = {};
		applyOptions(chalk, options);

		chalk.template = function () {
			const args = [].slice.call(arguments);
			return chalkTag.apply(null, [chalk.template].concat(args));
		};

		Object.setPrototypeOf(chalk, Chalk.prototype);
		Object.setPrototypeOf(chalk.template, chalk);

		chalk.template.constructor = Chalk;

		return chalk.template;
	}

	applyOptions(this, options);
}

// Use bright blue on Windows as the normal blue color is illegible
if (isSimpleWindowsTerm) {
	ansiStyles.blue.open = '\u001B[94m';
}

for (const key of Object.keys(ansiStyles)) {
	ansiStyles[key].closeRe = new RegExp(escapeStringRegexp(ansiStyles[key].close), 'g');

	styles[key] = {
		get() {
			const codes = ansiStyles[key];
			return build.call(this, this._styles ? this._styles.concat(codes) : [codes], this._empty, key);
		}
	};
}

styles.visible = {
	get() {
		return build.call(this, this._styles || [], true, 'visible');
	}
};

ansiStyles.color.closeRe = new RegExp(escapeStringRegexp(ansiStyles.color.close), 'g');
for (const model of Object.keys(ansiStyles.color.ansi)) {
	if (skipModels.has(model)) {
		continue;
	}

	styles[model] = {
		get() {
			const level = this.level;
			return function () {
				const open = ansiStyles.color[levelMapping[level]][model].apply(null, arguments);
				const codes = {
					open,
					close: ansiStyles.color.close,
					closeRe: ansiStyles.color.closeRe
				};
				return build.call(this, this._styles ? this._styles.concat(codes) : [codes], this._empty, model);
			};
		}
	};
}

ansiStyles.bgColor.closeRe = new RegExp(escapeStringRegexp(ansiStyles.bgColor.close), 'g');
for (const model of Object.keys(ansiStyles.bgColor.ansi)) {
	if (skipModels.has(model)) {
		continue;
	}

	const bgModel = 'bg' + model[0].toUpperCase() + model.slice(1);
	styles[bgModel] = {
		get() {
			const level = this.level;
			return function () {
				const open = ansiStyles.bgColor[levelMapping[level]][model].apply(null, arguments);
				const codes = {
					open,
					close: ansiStyles.bgColor.close,
					closeRe: ansiStyles.bgColor.closeRe
				};
				return build.call(this, this._styles ? this._styles.concat(codes) : [codes], this._empty, model);
			};
		}
	};
}

const proto = Object.defineProperties(() => {}, styles);

function build(_styles, _empty, key) {
	const builder = function () {
		return applyStyle.apply(builder, arguments);
	};

	builder._styles = _styles;
	builder._empty = _empty;

	const self = this;

	Object.defineProperty(builder, 'level', {
		enumerable: true,
		get() {
			return self.level;
		},
		set(level) {
			self.level = level;
		}
	});

	Object.defineProperty(builder, 'enabled', {
		enumerable: true,
		get() {
			return self.enabled;
		},
		set(enabled) {
			self.enabled = enabled;
		}
	});

	// See below for fix regarding invisible grey/dim combination on Windows
	builder.hasGrey = this.hasGrey || key === 'gray' || key === 'grey';

	// `__proto__` is used because we must return a function, but there is
	// no way to create a function with a different prototype
	builder.__proto__ = proto; // eslint-disable-line no-proto

	return builder;
}

function applyStyle() {
	// Support varags, but simply cast to string in case there's only one arg
	const args = arguments;
	const argsLen = args.length;
	let str = String(arguments[0]);

	if (argsLen === 0) {
		return '';
	}

	if (argsLen > 1) {
		// Don't slice `arguments`, it prevents V8 optimizations
		for (let a = 1; a < argsLen; a++) {
			str += ' ' + args[a];
		}
	}

	if (!this.enabled || this.level <= 0 || !str) {
		return this._empty ? '' : str;
	}

	// Turns out that on Windows dimmed gray text becomes invisible in cmd.exe,
	// see https://github.com/chalk/chalk/issues/58
	// If we're on Windows and we're dealing with a gray color, temporarily make 'dim' a noop.
	const originalDim = ansiStyles.dim.open;
	if (isSimpleWindowsTerm && this.hasGrey) {
		ansiStyles.dim.open = '';
	}

	for (const code of this._styles.slice().reverse()) {
		// Replace any instances already present with a re-opening code
		// otherwise only the part of the string until said closing code
		// will be colored, and the rest will simply be 'plain'.
		str = code.open + str.replace(code.closeRe, code.open) + code.close;

		// Close the styling before a linebreak and reopen
		// after next line to fix a bleed issue on macOS
		// https://github.com/chalk/chalk/pull/92
		str = str.replace(/\r?\n/g, `${code.close}$&${code.open}`);
	}

	// Reset the original `dim` if we changed it to work around the Windows dimmed gray issue
	ansiStyles.dim.open = originalDim;

	return str;
}

function chalkTag(chalk, strings) {
	if (!Array.isArray(strings)) {
		// If chalk() was called by itself or with a string,
		// return the string itself as a string.
		return [].slice.call(arguments, 1).join(' ');
	}

	const args = [].slice.call(arguments, 2);
	const parts = [strings.raw[0]];

	for (let i = 1; i < strings.length; i++) {
		parts.push(String(args[i - 1]).replace(/[{}\\]/g, '\\$&'));
		parts.push(String(strings.raw[i]));
	}

	return template(chalk, parts.join(''));
}

Object.defineProperties(Chalk.prototype, styles);

module.exports = Chalk(); // eslint-disable-line new-cap
module.exports.supportsColor = stdoutColor;
module.exports["default"] = module.exports; // For TypeScript


/***/ }),

/***/ "./node_modules/args/node_modules/chalk/templates.js":
/*!***********************************************************!*\
  !*** ./node_modules/args/node_modules/chalk/templates.js ***!
  \***********************************************************/
/***/ ((module) => {

"use strict";

const TEMPLATE_REGEX = /(?:\\(u[a-f\d]{4}|x[a-f\d]{2}|.))|(?:\{(~)?(\w+(?:\([^)]*\))?(?:\.\w+(?:\([^)]*\))?)*)(?:[ \t]|(?=\r?\n)))|(\})|((?:.|[\r\n\f])+?)/gi;
const STYLE_REGEX = /(?:^|\.)(\w+)(?:\(([^)]*)\))?/g;
const STRING_REGEX = /^(['"])((?:\\.|(?!\1)[^\\])*)\1$/;
const ESCAPE_REGEX = /\\(u[a-f\d]{4}|x[a-f\d]{2}|.)|([^\\])/gi;

const ESCAPES = new Map([
	['n', '\n'],
	['r', '\r'],
	['t', '\t'],
	['b', '\b'],
	['f', '\f'],
	['v', '\v'],
	['0', '\0'],
	['\\', '\\'],
	['e', '\u001B'],
	['a', '\u0007']
]);

function unescape(c) {
	if ((c[0] === 'u' && c.length === 5) || (c[0] === 'x' && c.length === 3)) {
		return String.fromCharCode(parseInt(c.slice(1), 16));
	}

	return ESCAPES.get(c) || c;
}

function parseArguments(name, args) {
	const results = [];
	const chunks = args.trim().split(/\s*,\s*/g);
	let matches;

	for (const chunk of chunks) {
		if (!isNaN(chunk)) {
			results.push(Number(chunk));
		} else if ((matches = chunk.match(STRING_REGEX))) {
			results.push(matches[2].replace(ESCAPE_REGEX, (m, escape, chr) => escape ? unescape(escape) : chr));
		} else {
			throw new Error(`Invalid Chalk template style argument: ${chunk} (in style '${name}')`);
		}
	}

	return results;
}

function parseStyle(style) {
	STYLE_REGEX.lastIndex = 0;

	const results = [];
	let matches;

	while ((matches = STYLE_REGEX.exec(style)) !== null) {
		const name = matches[1];

		if (matches[2]) {
			const args = parseArguments(name, matches[2]);
			results.push([name].concat(args));
		} else {
			results.push([name]);
		}
	}

	return results;
}

function buildStyle(chalk, styles) {
	const enabled = {};

	for (const layer of styles) {
		for (const style of layer.styles) {
			enabled[style[0]] = layer.inverse ? null : style.slice(1);
		}
	}

	let current = chalk;
	for (const styleName of Object.keys(enabled)) {
		if (Array.isArray(enabled[styleName])) {
			if (!(styleName in current)) {
				throw new Error(`Unknown Chalk style: ${styleName}`);
			}

			if (enabled[styleName].length > 0) {
				current = current[styleName].apply(current, enabled[styleName]);
			} else {
				current = current[styleName];
			}
		}
	}

	return current;
}

module.exports = (chalk, tmp) => {
	const styles = [];
	const chunks = [];
	let chunk = [];

	// eslint-disable-next-line max-params
	tmp.replace(TEMPLATE_REGEX, (m, escapeChar, inverse, style, close, chr) => {
		if (escapeChar) {
			chunk.push(unescape(escapeChar));
		} else if (style) {
			const str = chunk.join('');
			chunk = [];
			chunks.push(styles.length === 0 ? str : buildStyle(chalk, styles)(str));
			styles.push({inverse, styles: parseStyle(style)});
		} else if (close) {
			if (styles.length === 0) {
				throw new Error('Found extraneous } in Chalk template literal');
			}

			chunks.push(buildStyle(chalk, styles)(chunk.join('')));
			chunk = [];
			styles.pop();
		} else {
			chunk.push(chr);
		}
	});

	chunks.push(chunk.join(''));

	if (styles.length > 0) {
		const errMsg = `Chalk template literal is missing ${styles.length} closing bracket${styles.length === 1 ? '' : 's'} (\`}\`)`;
		throw new Error(errMsg);
	}

	return chunks.join('');
};


/***/ }),

/***/ "./node_modules/args/node_modules/has-flag/index.js":
/*!**********************************************************!*\
  !*** ./node_modules/args/node_modules/has-flag/index.js ***!
  \**********************************************************/
/***/ ((module) => {

"use strict";

module.exports = (flag, argv) => {
	argv = argv || process.argv;
	const prefix = flag.startsWith('-') ? '' : (flag.length === 1 ? '-' : '--');
	const pos = argv.indexOf(prefix + flag);
	const terminatorPos = argv.indexOf('--');
	return pos !== -1 && (terminatorPos === -1 ? true : pos < terminatorPos);
};


/***/ }),

/***/ "./node_modules/args/node_modules/supports-color/index.js":
/*!****************************************************************!*\
  !*** ./node_modules/args/node_modules/supports-color/index.js ***!
  \****************************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";

const os = __webpack_require__(/*! os */ "os");
const hasFlag = __webpack_require__(/*! has-flag */ "./node_modules/args/node_modules/has-flag/index.js");

const env = process.env;

let forceColor;
if (hasFlag('no-color') ||
	hasFlag('no-colors') ||
	hasFlag('color=false')) {
	forceColor = false;
} else if (hasFlag('color') ||
	hasFlag('colors') ||
	hasFlag('color=true') ||
	hasFlag('color=always')) {
	forceColor = true;
}
if ('FORCE_COLOR' in env) {
	forceColor = env.FORCE_COLOR.length === 0 || parseInt(env.FORCE_COLOR, 10) !== 0;
}

function translateLevel(level) {
	if (level === 0) {
		return false;
	}

	return {
		level,
		hasBasic: true,
		has256: level >= 2,
		has16m: level >= 3
	};
}

function supportsColor(stream) {
	if (forceColor === false) {
		return 0;
	}

	if (hasFlag('color=16m') ||
		hasFlag('color=full') ||
		hasFlag('color=truecolor')) {
		return 3;
	}

	if (hasFlag('color=256')) {
		return 2;
	}

	if (stream && !stream.isTTY && forceColor !== true) {
		return 0;
	}

	const min = forceColor ? 1 : 0;

	if (process.platform === 'win32') {
		// Node.js 7.5.0 is the first version of Node.js to include a patch to
		// libuv that enables 256 color output on Windows. Anything earlier and it
		// won't work. However, here we target Node.js 8 at minimum as it is an LTS
		// release, and Node.js 7 is not. Windows 10 build 10586 is the first Windows
		// release that supports 256 colors. Windows 10 build 14931 is the first release
		// that supports 16m/TrueColor.
		const osRelease = os.release().split('.');
		if (
			Number(process.versions.node.split('.')[0]) >= 8 &&
			Number(osRelease[0]) >= 10 &&
			Number(osRelease[2]) >= 10586
		) {
			return Number(osRelease[2]) >= 14931 ? 3 : 2;
		}

		return 1;
	}

	if ('CI' in env) {
		if (['TRAVIS', 'CIRCLECI', 'APPVEYOR', 'GITLAB_CI'].some(sign => sign in env) || env.CI_NAME === 'codeship') {
			return 1;
		}

		return min;
	}

	if ('TEAMCITY_VERSION' in env) {
		return /^(9\.(0*[1-9]\d*)\.|\d{2,}\.)/.test(env.TEAMCITY_VERSION) ? 1 : 0;
	}

	if (env.COLORTERM === 'truecolor') {
		return 3;
	}

	if ('TERM_PROGRAM' in env) {
		const version = parseInt((env.TERM_PROGRAM_VERSION || '').split('.')[0], 10);

		switch (env.TERM_PROGRAM) {
			case 'iTerm.app':
				return version >= 3 ? 3 : 2;
			case 'Apple_Terminal':
				return 2;
			// No default
		}
	}

	if (/-256(color)?$/i.test(env.TERM)) {
		return 2;
	}

	if (/^screen|^xterm|^vt100|^vt220|^rxvt|color|ansi|cygwin|linux/i.test(env.TERM)) {
		return 1;
	}

	if ('COLORTERM' in env) {
		return 1;
	}

	if (env.TERM === 'dumb') {
		return min;
	}

	return min;
}

function getSupportLevel(stream) {
	const level = supportsColor(stream);
	return translateLevel(level);
}

module.exports = {
	supportsColor: getSupportLevel,
	stdout: getSupportLevel(process.stdout),
	stderr: getSupportLevel(process.stderr)
};


/***/ }),

/***/ "./node_modules/camelcase/index.js":
/*!*****************************************!*\
  !*** ./node_modules/camelcase/index.js ***!
  \*****************************************/
/***/ ((module) => {

"use strict";


const preserveCamelCase = input => {
	let isLastCharLower = false;
	let isLastCharUpper = false;
	let isLastLastCharUpper = false;

	for (let i = 0; i < input.length; i++) {
		const c = input[i];

		if (isLastCharLower && /[a-zA-Z]/.test(c) && c.toUpperCase() === c) {
			input = input.slice(0, i) + '-' + input.slice(i);
			isLastCharLower = false;
			isLastLastCharUpper = isLastCharUpper;
			isLastCharUpper = true;
			i++;
		} else if (isLastCharUpper && isLastLastCharUpper && /[a-zA-Z]/.test(c) && c.toLowerCase() === c) {
			input = input.slice(0, i - 1) + '-' + input.slice(i - 1);
			isLastLastCharUpper = isLastCharUpper;
			isLastCharUpper = false;
			isLastCharLower = true;
		} else {
			isLastCharLower = c.toLowerCase() === c;
			isLastLastCharUpper = isLastCharUpper;
			isLastCharUpper = c.toUpperCase() === c;
		}
	}

	return input;
};

module.exports = (input, options) => {
	options = Object.assign({
		pascalCase: false
	}, options);

	const postProcess = x => options.pascalCase ? x.charAt(0).toUpperCase() + x.slice(1) : x;

	if (Array.isArray(input)) {
		input = input.map(x => x.trim())
			.filter(x => x.length)
			.join('-');
	} else {
		input = input.trim();
	}

	if (input.length === 0) {
		return '';
	}

	if (input.length === 1) {
		return options.pascalCase ? input.toUpperCase() : input.toLowerCase();
	}

	if (/^[a-z\d]+$/.test(input)) {
		return postProcess(input);
	}

	const hasUpperCase = input !== input.toLowerCase();

	if (hasUpperCase) {
		input = preserveCamelCase(input);
	}

	input = input
		.replace(/^[_.\- ]+/, '')
		.toLowerCase()
		.replace(/[_.\- ]+(\w|$)/g, (m, p1) => p1.toUpperCase());

	return postProcess(input);
};


/***/ }),

/***/ "./node_modules/color-convert/conversions.js":
/*!***************************************************!*\
  !*** ./node_modules/color-convert/conversions.js ***!
  \***************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

/* MIT license */
var cssKeywords = __webpack_require__(/*! color-name */ "./node_modules/color-name/index.js");

// NOTE: conversions should only return primitive values (i.e. arrays, or
//       values that give correct `typeof` results).
//       do not use box values types (i.e. Number(), String(), etc.)

var reverseKeywords = {};
for (var key in cssKeywords) {
	if (cssKeywords.hasOwnProperty(key)) {
		reverseKeywords[cssKeywords[key]] = key;
	}
}

var convert = module.exports = {
	rgb: {channels: 3, labels: 'rgb'},
	hsl: {channels: 3, labels: 'hsl'},
	hsv: {channels: 3, labels: 'hsv'},
	hwb: {channels: 3, labels: 'hwb'},
	cmyk: {channels: 4, labels: 'cmyk'},
	xyz: {channels: 3, labels: 'xyz'},
	lab: {channels: 3, labels: 'lab'},
	lch: {channels: 3, labels: 'lch'},
	hex: {channels: 1, labels: ['hex']},
	keyword: {channels: 1, labels: ['keyword']},
	ansi16: {channels: 1, labels: ['ansi16']},
	ansi256: {channels: 1, labels: ['ansi256']},
	hcg: {channels: 3, labels: ['h', 'c', 'g']},
	apple: {channels: 3, labels: ['r16', 'g16', 'b16']},
	gray: {channels: 1, labels: ['gray']}
};

// hide .channels and .labels properties
for (var model in convert) {
	if (convert.hasOwnProperty(model)) {
		if (!('channels' in convert[model])) {
			throw new Error('missing channels property: ' + model);
		}

		if (!('labels' in convert[model])) {
			throw new Error('missing channel labels property: ' + model);
		}

		if (convert[model].labels.length !== convert[model].channels) {
			throw new Error('channel and label counts mismatch: ' + model);
		}

		var channels = convert[model].channels;
		var labels = convert[model].labels;
		delete convert[model].channels;
		delete convert[model].labels;
		Object.defineProperty(convert[model], 'channels', {value: channels});
		Object.defineProperty(convert[model], 'labels', {value: labels});
	}
}

convert.rgb.hsl = function (rgb) {
	var r = rgb[0] / 255;
	var g = rgb[1] / 255;
	var b = rgb[2] / 255;
	var min = Math.min(r, g, b);
	var max = Math.max(r, g, b);
	var delta = max - min;
	var h;
	var s;
	var l;

	if (max === min) {
		h = 0;
	} else if (r === max) {
		h = (g - b) / delta;
	} else if (g === max) {
		h = 2 + (b - r) / delta;
	} else if (b === max) {
		h = 4 + (r - g) / delta;
	}

	h = Math.min(h * 60, 360);

	if (h < 0) {
		h += 360;
	}

	l = (min + max) / 2;

	if (max === min) {
		s = 0;
	} else if (l <= 0.5) {
		s = delta / (max + min);
	} else {
		s = delta / (2 - max - min);
	}

	return [h, s * 100, l * 100];
};

convert.rgb.hsv = function (rgb) {
	var rdif;
	var gdif;
	var bdif;
	var h;
	var s;

	var r = rgb[0] / 255;
	var g = rgb[1] / 255;
	var b = rgb[2] / 255;
	var v = Math.max(r, g, b);
	var diff = v - Math.min(r, g, b);
	var diffc = function (c) {
		return (v - c) / 6 / diff + 1 / 2;
	};

	if (diff === 0) {
		h = s = 0;
	} else {
		s = diff / v;
		rdif = diffc(r);
		gdif = diffc(g);
		bdif = diffc(b);

		if (r === v) {
			h = bdif - gdif;
		} else if (g === v) {
			h = (1 / 3) + rdif - bdif;
		} else if (b === v) {
			h = (2 / 3) + gdif - rdif;
		}
		if (h < 0) {
			h += 1;
		} else if (h > 1) {
			h -= 1;
		}
	}

	return [
		h * 360,
		s * 100,
		v * 100
	];
};

convert.rgb.hwb = function (rgb) {
	var r = rgb[0];
	var g = rgb[1];
	var b = rgb[2];
	var h = convert.rgb.hsl(rgb)[0];
	var w = 1 / 255 * Math.min(r, Math.min(g, b));

	b = 1 - 1 / 255 * Math.max(r, Math.max(g, b));

	return [h, w * 100, b * 100];
};

convert.rgb.cmyk = function (rgb) {
	var r = rgb[0] / 255;
	var g = rgb[1] / 255;
	var b = rgb[2] / 255;
	var c;
	var m;
	var y;
	var k;

	k = Math.min(1 - r, 1 - g, 1 - b);
	c = (1 - r - k) / (1 - k) || 0;
	m = (1 - g - k) / (1 - k) || 0;
	y = (1 - b - k) / (1 - k) || 0;

	return [c * 100, m * 100, y * 100, k * 100];
};

/**
 * See https://en.m.wikipedia.org/wiki/Euclidean_distance#Squared_Euclidean_distance
 * */
function comparativeDistance(x, y) {
	return (
		Math.pow(x[0] - y[0], 2) +
		Math.pow(x[1] - y[1], 2) +
		Math.pow(x[2] - y[2], 2)
	);
}

convert.rgb.keyword = function (rgb) {
	var reversed = reverseKeywords[rgb];
	if (reversed) {
		return reversed;
	}

	var currentClosestDistance = Infinity;
	var currentClosestKeyword;

	for (var keyword in cssKeywords) {
		if (cssKeywords.hasOwnProperty(keyword)) {
			var value = cssKeywords[keyword];

			// Compute comparative distance
			var distance = comparativeDistance(rgb, value);

			// Check if its less, if so set as closest
			if (distance < currentClosestDistance) {
				currentClosestDistance = distance;
				currentClosestKeyword = keyword;
			}
		}
	}

	return currentClosestKeyword;
};

convert.keyword.rgb = function (keyword) {
	return cssKeywords[keyword];
};

convert.rgb.xyz = function (rgb) {
	var r = rgb[0] / 255;
	var g = rgb[1] / 255;
	var b = rgb[2] / 255;

	// assume sRGB
	r = r > 0.04045 ? Math.pow(((r + 0.055) / 1.055), 2.4) : (r / 12.92);
	g = g > 0.04045 ? Math.pow(((g + 0.055) / 1.055), 2.4) : (g / 12.92);
	b = b > 0.04045 ? Math.pow(((b + 0.055) / 1.055), 2.4) : (b / 12.92);

	var x = (r * 0.4124) + (g * 0.3576) + (b * 0.1805);
	var y = (r * 0.2126) + (g * 0.7152) + (b * 0.0722);
	var z = (r * 0.0193) + (g * 0.1192) + (b * 0.9505);

	return [x * 100, y * 100, z * 100];
};

convert.rgb.lab = function (rgb) {
	var xyz = convert.rgb.xyz(rgb);
	var x = xyz[0];
	var y = xyz[1];
	var z = xyz[2];
	var l;
	var a;
	var b;

	x /= 95.047;
	y /= 100;
	z /= 108.883;

	x = x > 0.008856 ? Math.pow(x, 1 / 3) : (7.787 * x) + (16 / 116);
	y = y > 0.008856 ? Math.pow(y, 1 / 3) : (7.787 * y) + (16 / 116);
	z = z > 0.008856 ? Math.pow(z, 1 / 3) : (7.787 * z) + (16 / 116);

	l = (116 * y) - 16;
	a = 500 * (x - y);
	b = 200 * (y - z);

	return [l, a, b];
};

convert.hsl.rgb = function (hsl) {
	var h = hsl[0] / 360;
	var s = hsl[1] / 100;
	var l = hsl[2] / 100;
	var t1;
	var t2;
	var t3;
	var rgb;
	var val;

	if (s === 0) {
		val = l * 255;
		return [val, val, val];
	}

	if (l < 0.5) {
		t2 = l * (1 + s);
	} else {
		t2 = l + s - l * s;
	}

	t1 = 2 * l - t2;

	rgb = [0, 0, 0];
	for (var i = 0; i < 3; i++) {
		t3 = h + 1 / 3 * -(i - 1);
		if (t3 < 0) {
			t3++;
		}
		if (t3 > 1) {
			t3--;
		}

		if (6 * t3 < 1) {
			val = t1 + (t2 - t1) * 6 * t3;
		} else if (2 * t3 < 1) {
			val = t2;
		} else if (3 * t3 < 2) {
			val = t1 + (t2 - t1) * (2 / 3 - t3) * 6;
		} else {
			val = t1;
		}

		rgb[i] = val * 255;
	}

	return rgb;
};

convert.hsl.hsv = function (hsl) {
	var h = hsl[0];
	var s = hsl[1] / 100;
	var l = hsl[2] / 100;
	var smin = s;
	var lmin = Math.max(l, 0.01);
	var sv;
	var v;

	l *= 2;
	s *= (l <= 1) ? l : 2 - l;
	smin *= lmin <= 1 ? lmin : 2 - lmin;
	v = (l + s) / 2;
	sv = l === 0 ? (2 * smin) / (lmin + smin) : (2 * s) / (l + s);

	return [h, sv * 100, v * 100];
};

convert.hsv.rgb = function (hsv) {
	var h = hsv[0] / 60;
	var s = hsv[1] / 100;
	var v = hsv[2] / 100;
	var hi = Math.floor(h) % 6;

	var f = h - Math.floor(h);
	var p = 255 * v * (1 - s);
	var q = 255 * v * (1 - (s * f));
	var t = 255 * v * (1 - (s * (1 - f)));
	v *= 255;

	switch (hi) {
		case 0:
			return [v, t, p];
		case 1:
			return [q, v, p];
		case 2:
			return [p, v, t];
		case 3:
			return [p, q, v];
		case 4:
			return [t, p, v];
		case 5:
			return [v, p, q];
	}
};

convert.hsv.hsl = function (hsv) {
	var h = hsv[0];
	var s = hsv[1] / 100;
	var v = hsv[2] / 100;
	var vmin = Math.max(v, 0.01);
	var lmin;
	var sl;
	var l;

	l = (2 - s) * v;
	lmin = (2 - s) * vmin;
	sl = s * vmin;
	sl /= (lmin <= 1) ? lmin : 2 - lmin;
	sl = sl || 0;
	l /= 2;

	return [h, sl * 100, l * 100];
};

// http://dev.w3.org/csswg/css-color/#hwb-to-rgb
convert.hwb.rgb = function (hwb) {
	var h = hwb[0] / 360;
	var wh = hwb[1] / 100;
	var bl = hwb[2] / 100;
	var ratio = wh + bl;
	var i;
	var v;
	var f;
	var n;

	// wh + bl cant be > 1
	if (ratio > 1) {
		wh /= ratio;
		bl /= ratio;
	}

	i = Math.floor(6 * h);
	v = 1 - bl;
	f = 6 * h - i;

	if ((i & 0x01) !== 0) {
		f = 1 - f;
	}

	n = wh + f * (v - wh); // linear interpolation

	var r;
	var g;
	var b;
	switch (i) {
		default:
		case 6:
		case 0: r = v; g = n; b = wh; break;
		case 1: r = n; g = v; b = wh; break;
		case 2: r = wh; g = v; b = n; break;
		case 3: r = wh; g = n; b = v; break;
		case 4: r = n; g = wh; b = v; break;
		case 5: r = v; g = wh; b = n; break;
	}

	return [r * 255, g * 255, b * 255];
};

convert.cmyk.rgb = function (cmyk) {
	var c = cmyk[0] / 100;
	var m = cmyk[1] / 100;
	var y = cmyk[2] / 100;
	var k = cmyk[3] / 100;
	var r;
	var g;
	var b;

	r = 1 - Math.min(1, c * (1 - k) + k);
	g = 1 - Math.min(1, m * (1 - k) + k);
	b = 1 - Math.min(1, y * (1 - k) + k);

	return [r * 255, g * 255, b * 255];
};

convert.xyz.rgb = function (xyz) {
	var x = xyz[0] / 100;
	var y = xyz[1] / 100;
	var z = xyz[2] / 100;
	var r;
	var g;
	var b;

	r = (x * 3.2406) + (y * -1.5372) + (z * -0.4986);
	g = (x * -0.9689) + (y * 1.8758) + (z * 0.0415);
	b = (x * 0.0557) + (y * -0.2040) + (z * 1.0570);

	// assume sRGB
	r = r > 0.0031308
		? ((1.055 * Math.pow(r, 1.0 / 2.4)) - 0.055)
		: r * 12.92;

	g = g > 0.0031308
		? ((1.055 * Math.pow(g, 1.0 / 2.4)) - 0.055)
		: g * 12.92;

	b = b > 0.0031308
		? ((1.055 * Math.pow(b, 1.0 / 2.4)) - 0.055)
		: b * 12.92;

	r = Math.min(Math.max(0, r), 1);
	g = Math.min(Math.max(0, g), 1);
	b = Math.min(Math.max(0, b), 1);

	return [r * 255, g * 255, b * 255];
};

convert.xyz.lab = function (xyz) {
	var x = xyz[0];
	var y = xyz[1];
	var z = xyz[2];
	var l;
	var a;
	var b;

	x /= 95.047;
	y /= 100;
	z /= 108.883;

	x = x > 0.008856 ? Math.pow(x, 1 / 3) : (7.787 * x) + (16 / 116);
	y = y > 0.008856 ? Math.pow(y, 1 / 3) : (7.787 * y) + (16 / 116);
	z = z > 0.008856 ? Math.pow(z, 1 / 3) : (7.787 * z) + (16 / 116);

	l = (116 * y) - 16;
	a = 500 * (x - y);
	b = 200 * (y - z);

	return [l, a, b];
};

convert.lab.xyz = function (lab) {
	var l = lab[0];
	var a = lab[1];
	var b = lab[2];
	var x;
	var y;
	var z;

	y = (l + 16) / 116;
	x = a / 500 + y;
	z = y - b / 200;

	var y2 = Math.pow(y, 3);
	var x2 = Math.pow(x, 3);
	var z2 = Math.pow(z, 3);
	y = y2 > 0.008856 ? y2 : (y - 16 / 116) / 7.787;
	x = x2 > 0.008856 ? x2 : (x - 16 / 116) / 7.787;
	z = z2 > 0.008856 ? z2 : (z - 16 / 116) / 7.787;

	x *= 95.047;
	y *= 100;
	z *= 108.883;

	return [x, y, z];
};

convert.lab.lch = function (lab) {
	var l = lab[0];
	var a = lab[1];
	var b = lab[2];
	var hr;
	var h;
	var c;

	hr = Math.atan2(b, a);
	h = hr * 360 / 2 / Math.PI;

	if (h < 0) {
		h += 360;
	}

	c = Math.sqrt(a * a + b * b);

	return [l, c, h];
};

convert.lch.lab = function (lch) {
	var l = lch[0];
	var c = lch[1];
	var h = lch[2];
	var a;
	var b;
	var hr;

	hr = h / 360 * 2 * Math.PI;
	a = c * Math.cos(hr);
	b = c * Math.sin(hr);

	return [l, a, b];
};

convert.rgb.ansi16 = function (args) {
	var r = args[0];
	var g = args[1];
	var b = args[2];
	var value = 1 in arguments ? arguments[1] : convert.rgb.hsv(args)[2]; // hsv -> ansi16 optimization

	value = Math.round(value / 50);

	if (value === 0) {
		return 30;
	}

	var ansi = 30
		+ ((Math.round(b / 255) << 2)
		| (Math.round(g / 255) << 1)
		| Math.round(r / 255));

	if (value === 2) {
		ansi += 60;
	}

	return ansi;
};

convert.hsv.ansi16 = function (args) {
	// optimization here; we already know the value and don't need to get
	// it converted for us.
	return convert.rgb.ansi16(convert.hsv.rgb(args), args[2]);
};

convert.rgb.ansi256 = function (args) {
	var r = args[0];
	var g = args[1];
	var b = args[2];

	// we use the extended greyscale palette here, with the exception of
	// black and white. normal palette only has 4 greyscale shades.
	if (r === g && g === b) {
		if (r < 8) {
			return 16;
		}

		if (r > 248) {
			return 231;
		}

		return Math.round(((r - 8) / 247) * 24) + 232;
	}

	var ansi = 16
		+ (36 * Math.round(r / 255 * 5))
		+ (6 * Math.round(g / 255 * 5))
		+ Math.round(b / 255 * 5);

	return ansi;
};

convert.ansi16.rgb = function (args) {
	var color = args % 10;

	// handle greyscale
	if (color === 0 || color === 7) {
		if (args > 50) {
			color += 3.5;
		}

		color = color / 10.5 * 255;

		return [color, color, color];
	}

	var mult = (~~(args > 50) + 1) * 0.5;
	var r = ((color & 1) * mult) * 255;
	var g = (((color >> 1) & 1) * mult) * 255;
	var b = (((color >> 2) & 1) * mult) * 255;

	return [r, g, b];
};

convert.ansi256.rgb = function (args) {
	// handle greyscale
	if (args >= 232) {
		var c = (args - 232) * 10 + 8;
		return [c, c, c];
	}

	args -= 16;

	var rem;
	var r = Math.floor(args / 36) / 5 * 255;
	var g = Math.floor((rem = args % 36) / 6) / 5 * 255;
	var b = (rem % 6) / 5 * 255;

	return [r, g, b];
};

convert.rgb.hex = function (args) {
	var integer = ((Math.round(args[0]) & 0xFF) << 16)
		+ ((Math.round(args[1]) & 0xFF) << 8)
		+ (Math.round(args[2]) & 0xFF);

	var string = integer.toString(16).toUpperCase();
	return '000000'.substring(string.length) + string;
};

convert.hex.rgb = function (args) {
	var match = args.toString(16).match(/[a-f0-9]{6}|[a-f0-9]{3}/i);
	if (!match) {
		return [0, 0, 0];
	}

	var colorString = match[0];

	if (match[0].length === 3) {
		colorString = colorString.split('').map(function (char) {
			return char + char;
		}).join('');
	}

	var integer = parseInt(colorString, 16);
	var r = (integer >> 16) & 0xFF;
	var g = (integer >> 8) & 0xFF;
	var b = integer & 0xFF;

	return [r, g, b];
};

convert.rgb.hcg = function (rgb) {
	var r = rgb[0] / 255;
	var g = rgb[1] / 255;
	var b = rgb[2] / 255;
	var max = Math.max(Math.max(r, g), b);
	var min = Math.min(Math.min(r, g), b);
	var chroma = (max - min);
	var grayscale;
	var hue;

	if (chroma < 1) {
		grayscale = min / (1 - chroma);
	} else {
		grayscale = 0;
	}

	if (chroma <= 0) {
		hue = 0;
	} else
	if (max === r) {
		hue = ((g - b) / chroma) % 6;
	} else
	if (max === g) {
		hue = 2 + (b - r) / chroma;
	} else {
		hue = 4 + (r - g) / chroma + 4;
	}

	hue /= 6;
	hue %= 1;

	return [hue * 360, chroma * 100, grayscale * 100];
};

convert.hsl.hcg = function (hsl) {
	var s = hsl[1] / 100;
	var l = hsl[2] / 100;
	var c = 1;
	var f = 0;

	if (l < 0.5) {
		c = 2.0 * s * l;
	} else {
		c = 2.0 * s * (1.0 - l);
	}

	if (c < 1.0) {
		f = (l - 0.5 * c) / (1.0 - c);
	}

	return [hsl[0], c * 100, f * 100];
};

convert.hsv.hcg = function (hsv) {
	var s = hsv[1] / 100;
	var v = hsv[2] / 100;

	var c = s * v;
	var f = 0;

	if (c < 1.0) {
		f = (v - c) / (1 - c);
	}

	return [hsv[0], c * 100, f * 100];
};

convert.hcg.rgb = function (hcg) {
	var h = hcg[0] / 360;
	var c = hcg[1] / 100;
	var g = hcg[2] / 100;

	if (c === 0.0) {
		return [g * 255, g * 255, g * 255];
	}

	var pure = [0, 0, 0];
	var hi = (h % 1) * 6;
	var v = hi % 1;
	var w = 1 - v;
	var mg = 0;

	switch (Math.floor(hi)) {
		case 0:
			pure[0] = 1; pure[1] = v; pure[2] = 0; break;
		case 1:
			pure[0] = w; pure[1] = 1; pure[2] = 0; break;
		case 2:
			pure[0] = 0; pure[1] = 1; pure[2] = v; break;
		case 3:
			pure[0] = 0; pure[1] = w; pure[2] = 1; break;
		case 4:
			pure[0] = v; pure[1] = 0; pure[2] = 1; break;
		default:
			pure[0] = 1; pure[1] = 0; pure[2] = w;
	}

	mg = (1.0 - c) * g;

	return [
		(c * pure[0] + mg) * 255,
		(c * pure[1] + mg) * 255,
		(c * pure[2] + mg) * 255
	];
};

convert.hcg.hsv = function (hcg) {
	var c = hcg[1] / 100;
	var g = hcg[2] / 100;

	var v = c + g * (1.0 - c);
	var f = 0;

	if (v > 0.0) {
		f = c / v;
	}

	return [hcg[0], f * 100, v * 100];
};

convert.hcg.hsl = function (hcg) {
	var c = hcg[1] / 100;
	var g = hcg[2] / 100;

	var l = g * (1.0 - c) + 0.5 * c;
	var s = 0;

	if (l > 0.0 && l < 0.5) {
		s = c / (2 * l);
	} else
	if (l >= 0.5 && l < 1.0) {
		s = c / (2 * (1 - l));
	}

	return [hcg[0], s * 100, l * 100];
};

convert.hcg.hwb = function (hcg) {
	var c = hcg[1] / 100;
	var g = hcg[2] / 100;
	var v = c + g * (1.0 - c);
	return [hcg[0], (v - c) * 100, (1 - v) * 100];
};

convert.hwb.hcg = function (hwb) {
	var w = hwb[1] / 100;
	var b = hwb[2] / 100;
	var v = 1 - b;
	var c = v - w;
	var g = 0;

	if (c < 1) {
		g = (v - c) / (1 - c);
	}

	return [hwb[0], c * 100, g * 100];
};

convert.apple.rgb = function (apple) {
	return [(apple[0] / 65535) * 255, (apple[1] / 65535) * 255, (apple[2] / 65535) * 255];
};

convert.rgb.apple = function (rgb) {
	return [(rgb[0] / 255) * 65535, (rgb[1] / 255) * 65535, (rgb[2] / 255) * 65535];
};

convert.gray.rgb = function (args) {
	return [args[0] / 100 * 255, args[0] / 100 * 255, args[0] / 100 * 255];
};

convert.gray.hsl = convert.gray.hsv = function (args) {
	return [0, 0, args[0]];
};

convert.gray.hwb = function (gray) {
	return [0, 100, gray[0]];
};

convert.gray.cmyk = function (gray) {
	return [0, 0, 0, gray[0]];
};

convert.gray.lab = function (gray) {
	return [gray[0], 0, 0];
};

convert.gray.hex = function (gray) {
	var val = Math.round(gray[0] / 100 * 255) & 0xFF;
	var integer = (val << 16) + (val << 8) + val;

	var string = integer.toString(16).toUpperCase();
	return '000000'.substring(string.length) + string;
};

convert.rgb.gray = function (rgb) {
	var val = (rgb[0] + rgb[1] + rgb[2]) / 3;
	return [val / 255 * 100];
};


/***/ }),

/***/ "./node_modules/color-convert/index.js":
/*!*********************************************!*\
  !*** ./node_modules/color-convert/index.js ***!
  \*********************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var conversions = __webpack_require__(/*! ./conversions */ "./node_modules/color-convert/conversions.js");
var route = __webpack_require__(/*! ./route */ "./node_modules/color-convert/route.js");

var convert = {};

var models = Object.keys(conversions);

function wrapRaw(fn) {
	var wrappedFn = function (args) {
		if (args === undefined || args === null) {
			return args;
		}

		if (arguments.length > 1) {
			args = Array.prototype.slice.call(arguments);
		}

		return fn(args);
	};

	// preserve .conversion property if there is one
	if ('conversion' in fn) {
		wrappedFn.conversion = fn.conversion;
	}

	return wrappedFn;
}

function wrapRounded(fn) {
	var wrappedFn = function (args) {
		if (args === undefined || args === null) {
			return args;
		}

		if (arguments.length > 1) {
			args = Array.prototype.slice.call(arguments);
		}

		var result = fn(args);

		// we're assuming the result is an array here.
		// see notice in conversions.js; don't use box types
		// in conversion functions.
		if (typeof result === 'object') {
			for (var len = result.length, i = 0; i < len; i++) {
				result[i] = Math.round(result[i]);
			}
		}

		return result;
	};

	// preserve .conversion property if there is one
	if ('conversion' in fn) {
		wrappedFn.conversion = fn.conversion;
	}

	return wrappedFn;
}

models.forEach(function (fromModel) {
	convert[fromModel] = {};

	Object.defineProperty(convert[fromModel], 'channels', {value: conversions[fromModel].channels});
	Object.defineProperty(convert[fromModel], 'labels', {value: conversions[fromModel].labels});

	var routes = route(fromModel);
	var routeModels = Object.keys(routes);

	routeModels.forEach(function (toModel) {
		var fn = routes[toModel];

		convert[fromModel][toModel] = wrapRounded(fn);
		convert[fromModel][toModel].raw = wrapRaw(fn);
	});
});

module.exports = convert;


/***/ }),

/***/ "./node_modules/color-convert/route.js":
/*!*********************************************!*\
  !*** ./node_modules/color-convert/route.js ***!
  \*********************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var conversions = __webpack_require__(/*! ./conversions */ "./node_modules/color-convert/conversions.js");

/*
	this function routes a model to all other models.

	all functions that are routed have a property `.conversion` attached
	to the returned synthetic function. This property is an array
	of strings, each with the steps in between the 'from' and 'to'
	color models (inclusive).

	conversions that are not possible simply are not included.
*/

function buildGraph() {
	var graph = {};
	// https://jsperf.com/object-keys-vs-for-in-with-closure/3
	var models = Object.keys(conversions);

	for (var len = models.length, i = 0; i < len; i++) {
		graph[models[i]] = {
			// http://jsperf.com/1-vs-infinity
			// micro-opt, but this is simple.
			distance: -1,
			parent: null
		};
	}

	return graph;
}

// https://en.wikipedia.org/wiki/Breadth-first_search
function deriveBFS(fromModel) {
	var graph = buildGraph();
	var queue = [fromModel]; // unshift -> queue -> pop

	graph[fromModel].distance = 0;

	while (queue.length) {
		var current = queue.pop();
		var adjacents = Object.keys(conversions[current]);

		for (var len = adjacents.length, i = 0; i < len; i++) {
			var adjacent = adjacents[i];
			var node = graph[adjacent];

			if (node.distance === -1) {
				node.distance = graph[current].distance + 1;
				node.parent = current;
				queue.unshift(adjacent);
			}
		}
	}

	return graph;
}

function link(from, to) {
	return function (args) {
		return to(from(args));
	};
}

function wrapConversion(toModel, graph) {
	var path = [graph[toModel].parent, toModel];
	var fn = conversions[graph[toModel].parent][toModel];

	var cur = graph[toModel].parent;
	while (graph[cur].parent) {
		path.unshift(graph[cur].parent);
		fn = link(conversions[graph[cur].parent][cur], fn);
		cur = graph[cur].parent;
	}

	fn.conversion = path;
	return fn;
}

module.exports = function (fromModel) {
	var graph = deriveBFS(fromModel);
	var conversion = {};

	var models = Object.keys(graph);
	for (var len = models.length, i = 0; i < len; i++) {
		var toModel = models[i];
		var node = graph[toModel];

		if (node.parent === null) {
			// no possible conversion, or this node is the source model.
			continue;
		}

		conversion[toModel] = wrapConversion(toModel, graph);
	}

	return conversion;
};



/***/ }),

/***/ "./node_modules/color-name/index.js":
/*!******************************************!*\
  !*** ./node_modules/color-name/index.js ***!
  \******************************************/
/***/ ((module) => {

"use strict";


module.exports = {
	"aliceblue": [240, 248, 255],
	"antiquewhite": [250, 235, 215],
	"aqua": [0, 255, 255],
	"aquamarine": [127, 255, 212],
	"azure": [240, 255, 255],
	"beige": [245, 245, 220],
	"bisque": [255, 228, 196],
	"black": [0, 0, 0],
	"blanchedalmond": [255, 235, 205],
	"blue": [0, 0, 255],
	"blueviolet": [138, 43, 226],
	"brown": [165, 42, 42],
	"burlywood": [222, 184, 135],
	"cadetblue": [95, 158, 160],
	"chartreuse": [127, 255, 0],
	"chocolate": [210, 105, 30],
	"coral": [255, 127, 80],
	"cornflowerblue": [100, 149, 237],
	"cornsilk": [255, 248, 220],
	"crimson": [220, 20, 60],
	"cyan": [0, 255, 255],
	"darkblue": [0, 0, 139],
	"darkcyan": [0, 139, 139],
	"darkgoldenrod": [184, 134, 11],
	"darkgray": [169, 169, 169],
	"darkgreen": [0, 100, 0],
	"darkgrey": [169, 169, 169],
	"darkkhaki": [189, 183, 107],
	"darkmagenta": [139, 0, 139],
	"darkolivegreen": [85, 107, 47],
	"darkorange": [255, 140, 0],
	"darkorchid": [153, 50, 204],
	"darkred": [139, 0, 0],
	"darksalmon": [233, 150, 122],
	"darkseagreen": [143, 188, 143],
	"darkslateblue": [72, 61, 139],
	"darkslategray": [47, 79, 79],
	"darkslategrey": [47, 79, 79],
	"darkturquoise": [0, 206, 209],
	"darkviolet": [148, 0, 211],
	"deeppink": [255, 20, 147],
	"deepskyblue": [0, 191, 255],
	"dimgray": [105, 105, 105],
	"dimgrey": [105, 105, 105],
	"dodgerblue": [30, 144, 255],
	"firebrick": [178, 34, 34],
	"floralwhite": [255, 250, 240],
	"forestgreen": [34, 139, 34],
	"fuchsia": [255, 0, 255],
	"gainsboro": [220, 220, 220],
	"ghostwhite": [248, 248, 255],
	"gold": [255, 215, 0],
	"goldenrod": [218, 165, 32],
	"gray": [128, 128, 128],
	"green": [0, 128, 0],
	"greenyellow": [173, 255, 47],
	"grey": [128, 128, 128],
	"honeydew": [240, 255, 240],
	"hotpink": [255, 105, 180],
	"indianred": [205, 92, 92],
	"indigo": [75, 0, 130],
	"ivory": [255, 255, 240],
	"khaki": [240, 230, 140],
	"lavender": [230, 230, 250],
	"lavenderblush": [255, 240, 245],
	"lawngreen": [124, 252, 0],
	"lemonchiffon": [255, 250, 205],
	"lightblue": [173, 216, 230],
	"lightcoral": [240, 128, 128],
	"lightcyan": [224, 255, 255],
	"lightgoldenrodyellow": [250, 250, 210],
	"lightgray": [211, 211, 211],
	"lightgreen": [144, 238, 144],
	"lightgrey": [211, 211, 211],
	"lightpink": [255, 182, 193],
	"lightsalmon": [255, 160, 122],
	"lightseagreen": [32, 178, 170],
	"lightskyblue": [135, 206, 250],
	"lightslategray": [119, 136, 153],
	"lightslategrey": [119, 136, 153],
	"lightsteelblue": [176, 196, 222],
	"lightyellow": [255, 255, 224],
	"lime": [0, 255, 0],
	"limegreen": [50, 205, 50],
	"linen": [250, 240, 230],
	"magenta": [255, 0, 255],
	"maroon": [128, 0, 0],
	"mediumaquamarine": [102, 205, 170],
	"mediumblue": [0, 0, 205],
	"mediumorchid": [186, 85, 211],
	"mediumpurple": [147, 112, 219],
	"mediumseagreen": [60, 179, 113],
	"mediumslateblue": [123, 104, 238],
	"mediumspringgreen": [0, 250, 154],
	"mediumturquoise": [72, 209, 204],
	"mediumvioletred": [199, 21, 133],
	"midnightblue": [25, 25, 112],
	"mintcream": [245, 255, 250],
	"mistyrose": [255, 228, 225],
	"moccasin": [255, 228, 181],
	"navajowhite": [255, 222, 173],
	"navy": [0, 0, 128],
	"oldlace": [253, 245, 230],
	"olive": [128, 128, 0],
	"olivedrab": [107, 142, 35],
	"orange": [255, 165, 0],
	"orangered": [255, 69, 0],
	"orchid": [218, 112, 214],
	"palegoldenrod": [238, 232, 170],
	"palegreen": [152, 251, 152],
	"paleturquoise": [175, 238, 238],
	"palevioletred": [219, 112, 147],
	"papayawhip": [255, 239, 213],
	"peachpuff": [255, 218, 185],
	"peru": [205, 133, 63],
	"pink": [255, 192, 203],
	"plum": [221, 160, 221],
	"powderblue": [176, 224, 230],
	"purple": [128, 0, 128],
	"rebeccapurple": [102, 51, 153],
	"red": [255, 0, 0],
	"rosybrown": [188, 143, 143],
	"royalblue": [65, 105, 225],
	"saddlebrown": [139, 69, 19],
	"salmon": [250, 128, 114],
	"sandybrown": [244, 164, 96],
	"seagreen": [46, 139, 87],
	"seashell": [255, 245, 238],
	"sienna": [160, 82, 45],
	"silver": [192, 192, 192],
	"skyblue": [135, 206, 235],
	"slateblue": [106, 90, 205],
	"slategray": [112, 128, 144],
	"slategrey": [112, 128, 144],
	"snow": [255, 250, 250],
	"springgreen": [0, 255, 127],
	"steelblue": [70, 130, 180],
	"tan": [210, 180, 140],
	"teal": [0, 128, 128],
	"thistle": [216, 191, 216],
	"tomato": [255, 99, 71],
	"turquoise": [64, 224, 208],
	"violet": [238, 130, 238],
	"wheat": [245, 222, 179],
	"white": [255, 255, 255],
	"whitesmoke": [245, 245, 245],
	"yellow": [255, 255, 0],
	"yellowgreen": [154, 205, 50]
};


/***/ }),

/***/ "./node_modules/escape-string-regexp/index.js":
/*!****************************************************!*\
  !*** ./node_modules/escape-string-regexp/index.js ***!
  \****************************************************/
/***/ ((module) => {

"use strict";


var matchOperatorsRe = /[|\\{}()[\]^$+*?.]/g;

module.exports = function (str) {
	if (typeof str !== 'string') {
		throw new TypeError('Expected a string');
	}

	return str.replace(matchOperatorsRe, '\\$&');
};


/***/ }),

/***/ "./node_modules/fs-extra/lib/copy/copy-sync.js":
/*!*****************************************************!*\
  !*** ./node_modules/fs-extra/lib/copy/copy-sync.js ***!
  \*****************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


const fs = __webpack_require__(/*! graceful-fs */ "./node_modules/graceful-fs/graceful-fs.js")
const path = __webpack_require__(/*! path */ "path")
const mkdirsSync = (__webpack_require__(/*! ../mkdirs */ "./node_modules/fs-extra/lib/mkdirs/index.js").mkdirsSync)
const utimesMillisSync = (__webpack_require__(/*! ../util/utimes */ "./node_modules/fs-extra/lib/util/utimes.js").utimesMillisSync)
const stat = __webpack_require__(/*! ../util/stat */ "./node_modules/fs-extra/lib/util/stat.js")

function copySync (src, dest, opts) {
  if (typeof opts === 'function') {
    opts = { filter: opts }
  }

  opts = opts || {}
  opts.clobber = 'clobber' in opts ? !!opts.clobber : true // default to true for now
  opts.overwrite = 'overwrite' in opts ? !!opts.overwrite : opts.clobber // overwrite falls back to clobber

  // Warn about using preserveTimestamps on 32-bit node
  if (opts.preserveTimestamps && process.arch === 'ia32') {
    process.emitWarning(
      'Using the preserveTimestamps option in 32-bit node is not recommended;\n\n' +
      '\tsee https://github.com/jprichardson/node-fs-extra/issues/269',
      'Warning', 'fs-extra-WARN0002'
    )
  }

  const { srcStat, destStat } = stat.checkPathsSync(src, dest, 'copy', opts)
  stat.checkParentPathsSync(src, srcStat, dest, 'copy')
  return handleFilterAndCopy(destStat, src, dest, opts)
}

function handleFilterAndCopy (destStat, src, dest, opts) {
  if (opts.filter && !opts.filter(src, dest)) return
  const destParent = path.dirname(dest)
  if (!fs.existsSync(destParent)) mkdirsSync(destParent)
  return getStats(destStat, src, dest, opts)
}

function startCopy (destStat, src, dest, opts) {
  if (opts.filter && !opts.filter(src, dest)) return
  return getStats(destStat, src, dest, opts)
}

function getStats (destStat, src, dest, opts) {
  const statSync = opts.dereference ? fs.statSync : fs.lstatSync
  const srcStat = statSync(src)

  if (srcStat.isDirectory()) return onDir(srcStat, destStat, src, dest, opts)
  else if (srcStat.isFile() ||
           srcStat.isCharacterDevice() ||
           srcStat.isBlockDevice()) return onFile(srcStat, destStat, src, dest, opts)
  else if (srcStat.isSymbolicLink()) return onLink(destStat, src, dest, opts)
  else if (srcStat.isSocket()) throw new Error(`Cannot copy a socket file: ${src}`)
  else if (srcStat.isFIFO()) throw new Error(`Cannot copy a FIFO pipe: ${src}`)
  throw new Error(`Unknown file: ${src}`)
}

function onFile (srcStat, destStat, src, dest, opts) {
  if (!destStat) return copyFile(srcStat, src, dest, opts)
  return mayCopyFile(srcStat, src, dest, opts)
}

function mayCopyFile (srcStat, src, dest, opts) {
  if (opts.overwrite) {
    fs.unlinkSync(dest)
    return copyFile(srcStat, src, dest, opts)
  } else if (opts.errorOnExist) {
    throw new Error(`'${dest}' already exists`)
  }
}

function copyFile (srcStat, src, dest, opts) {
  fs.copyFileSync(src, dest)
  if (opts.preserveTimestamps) handleTimestamps(srcStat.mode, src, dest)
  return setDestMode(dest, srcStat.mode)
}

function handleTimestamps (srcMode, src, dest) {
  // Make sure the file is writable before setting the timestamp
  // otherwise open fails with EPERM when invoked with 'r+'
  // (through utimes call)
  if (fileIsNotWritable(srcMode)) makeFileWritable(dest, srcMode)
  return setDestTimestamps(src, dest)
}

function fileIsNotWritable (srcMode) {
  return (srcMode & 0o200) === 0
}

function makeFileWritable (dest, srcMode) {
  return setDestMode(dest, srcMode | 0o200)
}

function setDestMode (dest, srcMode) {
  return fs.chmodSync(dest, srcMode)
}

function setDestTimestamps (src, dest) {
  // The initial srcStat.atime cannot be trusted
  // because it is modified by the read(2) system call
  // (See https://nodejs.org/api/fs.html#fs_stat_time_values)
  const updatedSrcStat = fs.statSync(src)
  return utimesMillisSync(dest, updatedSrcStat.atime, updatedSrcStat.mtime)
}

function onDir (srcStat, destStat, src, dest, opts) {
  if (!destStat) return mkDirAndCopy(srcStat.mode, src, dest, opts)
  return copyDir(src, dest, opts)
}

function mkDirAndCopy (srcMode, src, dest, opts) {
  fs.mkdirSync(dest)
  copyDir(src, dest, opts)
  return setDestMode(dest, srcMode)
}

function copyDir (src, dest, opts) {
  fs.readdirSync(src).forEach(item => copyDirItem(item, src, dest, opts))
}

function copyDirItem (item, src, dest, opts) {
  const srcItem = path.join(src, item)
  const destItem = path.join(dest, item)
  const { destStat } = stat.checkPathsSync(srcItem, destItem, 'copy', opts)
  return startCopy(destStat, srcItem, destItem, opts)
}

function onLink (destStat, src, dest, opts) {
  let resolvedSrc = fs.readlinkSync(src)
  if (opts.dereference) {
    resolvedSrc = path.resolve(process.cwd(), resolvedSrc)
  }

  if (!destStat) {
    return fs.symlinkSync(resolvedSrc, dest)
  } else {
    let resolvedDest
    try {
      resolvedDest = fs.readlinkSync(dest)
    } catch (err) {
      // dest exists and is a regular file or directory,
      // Windows may throw UNKNOWN error. If dest already exists,
      // fs throws error anyway, so no need to guard against it here.
      if (err.code === 'EINVAL' || err.code === 'UNKNOWN') return fs.symlinkSync(resolvedSrc, dest)
      throw err
    }
    if (opts.dereference) {
      resolvedDest = path.resolve(process.cwd(), resolvedDest)
    }
    if (stat.isSrcSubdir(resolvedSrc, resolvedDest)) {
      throw new Error(`Cannot copy '${resolvedSrc}' to a subdirectory of itself, '${resolvedDest}'.`)
    }

    // prevent copy if src is a subdir of dest since unlinking
    // dest in this case would result in removing src contents
    // and therefore a broken symlink would be created.
    if (fs.statSync(dest).isDirectory() && stat.isSrcSubdir(resolvedDest, resolvedSrc)) {
      throw new Error(`Cannot overwrite '${resolvedDest}' with '${resolvedSrc}'.`)
    }
    return copyLink(resolvedSrc, dest)
  }
}

function copyLink (resolvedSrc, dest) {
  fs.unlinkSync(dest)
  return fs.symlinkSync(resolvedSrc, dest)
}

module.exports = copySync


/***/ }),

/***/ "./node_modules/fs-extra/lib/copy/copy.js":
/*!************************************************!*\
  !*** ./node_modules/fs-extra/lib/copy/copy.js ***!
  \************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


const fs = __webpack_require__(/*! graceful-fs */ "./node_modules/graceful-fs/graceful-fs.js")
const path = __webpack_require__(/*! path */ "path")
const mkdirs = (__webpack_require__(/*! ../mkdirs */ "./node_modules/fs-extra/lib/mkdirs/index.js").mkdirs)
const pathExists = (__webpack_require__(/*! ../path-exists */ "./node_modules/fs-extra/lib/path-exists/index.js").pathExists)
const utimesMillis = (__webpack_require__(/*! ../util/utimes */ "./node_modules/fs-extra/lib/util/utimes.js").utimesMillis)
const stat = __webpack_require__(/*! ../util/stat */ "./node_modules/fs-extra/lib/util/stat.js")

function copy (src, dest, opts, cb) {
  if (typeof opts === 'function' && !cb) {
    cb = opts
    opts = {}
  } else if (typeof opts === 'function') {
    opts = { filter: opts }
  }

  cb = cb || function () {}
  opts = opts || {}

  opts.clobber = 'clobber' in opts ? !!opts.clobber : true // default to true for now
  opts.overwrite = 'overwrite' in opts ? !!opts.overwrite : opts.clobber // overwrite falls back to clobber

  // Warn about using preserveTimestamps on 32-bit node
  if (opts.preserveTimestamps && process.arch === 'ia32') {
    process.emitWarning(
      'Using the preserveTimestamps option in 32-bit node is not recommended;\n\n' +
      '\tsee https://github.com/jprichardson/node-fs-extra/issues/269',
      'Warning', 'fs-extra-WARN0001'
    )
  }

  stat.checkPaths(src, dest, 'copy', opts, (err, stats) => {
    if (err) return cb(err)
    const { srcStat, destStat } = stats
    stat.checkParentPaths(src, srcStat, dest, 'copy', err => {
      if (err) return cb(err)
      if (opts.filter) return handleFilter(checkParentDir, destStat, src, dest, opts, cb)
      return checkParentDir(destStat, src, dest, opts, cb)
    })
  })
}

function checkParentDir (destStat, src, dest, opts, cb) {
  const destParent = path.dirname(dest)
  pathExists(destParent, (err, dirExists) => {
    if (err) return cb(err)
    if (dirExists) return getStats(destStat, src, dest, opts, cb)
    mkdirs(destParent, err => {
      if (err) return cb(err)
      return getStats(destStat, src, dest, opts, cb)
    })
  })
}

function handleFilter (onInclude, destStat, src, dest, opts, cb) {
  Promise.resolve(opts.filter(src, dest)).then(include => {
    if (include) return onInclude(destStat, src, dest, opts, cb)
    return cb()
  }, error => cb(error))
}

function startCopy (destStat, src, dest, opts, cb) {
  if (opts.filter) return handleFilter(getStats, destStat, src, dest, opts, cb)
  return getStats(destStat, src, dest, opts, cb)
}

function getStats (destStat, src, dest, opts, cb) {
  const stat = opts.dereference ? fs.stat : fs.lstat
  stat(src, (err, srcStat) => {
    if (err) return cb(err)

    if (srcStat.isDirectory()) return onDir(srcStat, destStat, src, dest, opts, cb)
    else if (srcStat.isFile() ||
             srcStat.isCharacterDevice() ||
             srcStat.isBlockDevice()) return onFile(srcStat, destStat, src, dest, opts, cb)
    else if (srcStat.isSymbolicLink()) return onLink(destStat, src, dest, opts, cb)
    else if (srcStat.isSocket()) return cb(new Error(`Cannot copy a socket file: ${src}`))
    else if (srcStat.isFIFO()) return cb(new Error(`Cannot copy a FIFO pipe: ${src}`))
    return cb(new Error(`Unknown file: ${src}`))
  })
}

function onFile (srcStat, destStat, src, dest, opts, cb) {
  if (!destStat) return copyFile(srcStat, src, dest, opts, cb)
  return mayCopyFile(srcStat, src, dest, opts, cb)
}

function mayCopyFile (srcStat, src, dest, opts, cb) {
  if (opts.overwrite) {
    fs.unlink(dest, err => {
      if (err) return cb(err)
      return copyFile(srcStat, src, dest, opts, cb)
    })
  } else if (opts.errorOnExist) {
    return cb(new Error(`'${dest}' already exists`))
  } else return cb()
}

function copyFile (srcStat, src, dest, opts, cb) {
  fs.copyFile(src, dest, err => {
    if (err) return cb(err)
    if (opts.preserveTimestamps) return handleTimestampsAndMode(srcStat.mode, src, dest, cb)
    return setDestMode(dest, srcStat.mode, cb)
  })
}

function handleTimestampsAndMode (srcMode, src, dest, cb) {
  // Make sure the file is writable before setting the timestamp
  // otherwise open fails with EPERM when invoked with 'r+'
  // (through utimes call)
  if (fileIsNotWritable(srcMode)) {
    return makeFileWritable(dest, srcMode, err => {
      if (err) return cb(err)
      return setDestTimestampsAndMode(srcMode, src, dest, cb)
    })
  }
  return setDestTimestampsAndMode(srcMode, src, dest, cb)
}

function fileIsNotWritable (srcMode) {
  return (srcMode & 0o200) === 0
}

function makeFileWritable (dest, srcMode, cb) {
  return setDestMode(dest, srcMode | 0o200, cb)
}

function setDestTimestampsAndMode (srcMode, src, dest, cb) {
  setDestTimestamps(src, dest, err => {
    if (err) return cb(err)
    return setDestMode(dest, srcMode, cb)
  })
}

function setDestMode (dest, srcMode, cb) {
  return fs.chmod(dest, srcMode, cb)
}

function setDestTimestamps (src, dest, cb) {
  // The initial srcStat.atime cannot be trusted
  // because it is modified by the read(2) system call
  // (See https://nodejs.org/api/fs.html#fs_stat_time_values)
  fs.stat(src, (err, updatedSrcStat) => {
    if (err) return cb(err)
    return utimesMillis(dest, updatedSrcStat.atime, updatedSrcStat.mtime, cb)
  })
}

function onDir (srcStat, destStat, src, dest, opts, cb) {
  if (!destStat) return mkDirAndCopy(srcStat.mode, src, dest, opts, cb)
  return copyDir(src, dest, opts, cb)
}

function mkDirAndCopy (srcMode, src, dest, opts, cb) {
  fs.mkdir(dest, err => {
    if (err) return cb(err)
    copyDir(src, dest, opts, err => {
      if (err) return cb(err)
      return setDestMode(dest, srcMode, cb)
    })
  })
}

function copyDir (src, dest, opts, cb) {
  fs.readdir(src, (err, items) => {
    if (err) return cb(err)
    return copyDirItems(items, src, dest, opts, cb)
  })
}

function copyDirItems (items, src, dest, opts, cb) {
  const item = items.pop()
  if (!item) return cb()
  return copyDirItem(items, item, src, dest, opts, cb)
}

function copyDirItem (items, item, src, dest, opts, cb) {
  const srcItem = path.join(src, item)
  const destItem = path.join(dest, item)
  stat.checkPaths(srcItem, destItem, 'copy', opts, (err, stats) => {
    if (err) return cb(err)
    const { destStat } = stats
    startCopy(destStat, srcItem, destItem, opts, err => {
      if (err) return cb(err)
      return copyDirItems(items, src, dest, opts, cb)
    })
  })
}

function onLink (destStat, src, dest, opts, cb) {
  fs.readlink(src, (err, resolvedSrc) => {
    if (err) return cb(err)
    if (opts.dereference) {
      resolvedSrc = path.resolve(process.cwd(), resolvedSrc)
    }

    if (!destStat) {
      return fs.symlink(resolvedSrc, dest, cb)
    } else {
      fs.readlink(dest, (err, resolvedDest) => {
        if (err) {
          // dest exists and is a regular file or directory,
          // Windows may throw UNKNOWN error. If dest already exists,
          // fs throws error anyway, so no need to guard against it here.
          if (err.code === 'EINVAL' || err.code === 'UNKNOWN') return fs.symlink(resolvedSrc, dest, cb)
          return cb(err)
        }
        if (opts.dereference) {
          resolvedDest = path.resolve(process.cwd(), resolvedDest)
        }
        if (stat.isSrcSubdir(resolvedSrc, resolvedDest)) {
          return cb(new Error(`Cannot copy '${resolvedSrc}' to a subdirectory of itself, '${resolvedDest}'.`))
        }

        // do not copy if src is a subdir of dest since unlinking
        // dest in this case would result in removing src contents
        // and therefore a broken symlink would be created.
        if (destStat.isDirectory() && stat.isSrcSubdir(resolvedDest, resolvedSrc)) {
          return cb(new Error(`Cannot overwrite '${resolvedDest}' with '${resolvedSrc}'.`))
        }
        return copyLink(resolvedSrc, dest, cb)
      })
    }
  })
}

function copyLink (resolvedSrc, dest, cb) {
  fs.unlink(dest, err => {
    if (err) return cb(err)
    return fs.symlink(resolvedSrc, dest, cb)
  })
}

module.exports = copy


/***/ }),

/***/ "./node_modules/fs-extra/lib/copy/index.js":
/*!*************************************************!*\
  !*** ./node_modules/fs-extra/lib/copy/index.js ***!
  \*************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


const u = (__webpack_require__(/*! universalify */ "./node_modules/universalify/index.js").fromCallback)
module.exports = {
  copy: u(__webpack_require__(/*! ./copy */ "./node_modules/fs-extra/lib/copy/copy.js")),
  copySync: __webpack_require__(/*! ./copy-sync */ "./node_modules/fs-extra/lib/copy/copy-sync.js")
}


/***/ }),

/***/ "./node_modules/fs-extra/lib/empty/index.js":
/*!**************************************************!*\
  !*** ./node_modules/fs-extra/lib/empty/index.js ***!
  \**************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


const u = (__webpack_require__(/*! universalify */ "./node_modules/universalify/index.js").fromPromise)
const fs = __webpack_require__(/*! ../fs */ "./node_modules/fs-extra/lib/fs/index.js")
const path = __webpack_require__(/*! path */ "path")
const mkdir = __webpack_require__(/*! ../mkdirs */ "./node_modules/fs-extra/lib/mkdirs/index.js")
const remove = __webpack_require__(/*! ../remove */ "./node_modules/fs-extra/lib/remove/index.js")

const emptyDir = u(async function emptyDir (dir) {
  let items
  try {
    items = await fs.readdir(dir)
  } catch {
    return mkdir.mkdirs(dir)
  }

  return Promise.all(items.map(item => remove.remove(path.join(dir, item))))
})

function emptyDirSync (dir) {
  let items
  try {
    items = fs.readdirSync(dir)
  } catch {
    return mkdir.mkdirsSync(dir)
  }

  items.forEach(item => {
    item = path.join(dir, item)
    remove.removeSync(item)
  })
}

module.exports = {
  emptyDirSync,
  emptydirSync: emptyDirSync,
  emptyDir,
  emptydir: emptyDir
}


/***/ }),

/***/ "./node_modules/fs-extra/lib/ensure/file.js":
/*!**************************************************!*\
  !*** ./node_modules/fs-extra/lib/ensure/file.js ***!
  \**************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


const u = (__webpack_require__(/*! universalify */ "./node_modules/universalify/index.js").fromCallback)
const path = __webpack_require__(/*! path */ "path")
const fs = __webpack_require__(/*! graceful-fs */ "./node_modules/graceful-fs/graceful-fs.js")
const mkdir = __webpack_require__(/*! ../mkdirs */ "./node_modules/fs-extra/lib/mkdirs/index.js")

function createFile (file, callback) {
  function makeFile () {
    fs.writeFile(file, '', err => {
      if (err) return callback(err)
      callback()
    })
  }

  fs.stat(file, (err, stats) => { // eslint-disable-line handle-callback-err
    if (!err && stats.isFile()) return callback()
    const dir = path.dirname(file)
    fs.stat(dir, (err, stats) => {
      if (err) {
        // if the directory doesn't exist, make it
        if (err.code === 'ENOENT') {
          return mkdir.mkdirs(dir, err => {
            if (err) return callback(err)
            makeFile()
          })
        }
        return callback(err)
      }

      if (stats.isDirectory()) makeFile()
      else {
        // parent is not a directory
        // This is just to cause an internal ENOTDIR error to be thrown
        fs.readdir(dir, err => {
          if (err) return callback(err)
        })
      }
    })
  })
}

function createFileSync (file) {
  let stats
  try {
    stats = fs.statSync(file)
  } catch {}
  if (stats && stats.isFile()) return

  const dir = path.dirname(file)
  try {
    if (!fs.statSync(dir).isDirectory()) {
      // parent is not a directory
      // This is just to cause an internal ENOTDIR error to be thrown
      fs.readdirSync(dir)
    }
  } catch (err) {
    // If the stat call above failed because the directory doesn't exist, create it
    if (err && err.code === 'ENOENT') mkdir.mkdirsSync(dir)
    else throw err
  }

  fs.writeFileSync(file, '')
}

module.exports = {
  createFile: u(createFile),
  createFileSync
}


/***/ }),

/***/ "./node_modules/fs-extra/lib/ensure/index.js":
/*!***************************************************!*\
  !*** ./node_modules/fs-extra/lib/ensure/index.js ***!
  \***************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


const { createFile, createFileSync } = __webpack_require__(/*! ./file */ "./node_modules/fs-extra/lib/ensure/file.js")
const { createLink, createLinkSync } = __webpack_require__(/*! ./link */ "./node_modules/fs-extra/lib/ensure/link.js")
const { createSymlink, createSymlinkSync } = __webpack_require__(/*! ./symlink */ "./node_modules/fs-extra/lib/ensure/symlink.js")

module.exports = {
  // file
  createFile,
  createFileSync,
  ensureFile: createFile,
  ensureFileSync: createFileSync,
  // link
  createLink,
  createLinkSync,
  ensureLink: createLink,
  ensureLinkSync: createLinkSync,
  // symlink
  createSymlink,
  createSymlinkSync,
  ensureSymlink: createSymlink,
  ensureSymlinkSync: createSymlinkSync
}


/***/ }),

/***/ "./node_modules/fs-extra/lib/ensure/link.js":
/*!**************************************************!*\
  !*** ./node_modules/fs-extra/lib/ensure/link.js ***!
  \**************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


const u = (__webpack_require__(/*! universalify */ "./node_modules/universalify/index.js").fromCallback)
const path = __webpack_require__(/*! path */ "path")
const fs = __webpack_require__(/*! graceful-fs */ "./node_modules/graceful-fs/graceful-fs.js")
const mkdir = __webpack_require__(/*! ../mkdirs */ "./node_modules/fs-extra/lib/mkdirs/index.js")
const pathExists = (__webpack_require__(/*! ../path-exists */ "./node_modules/fs-extra/lib/path-exists/index.js").pathExists)
const { areIdentical } = __webpack_require__(/*! ../util/stat */ "./node_modules/fs-extra/lib/util/stat.js")

function createLink (srcpath, dstpath, callback) {
  function makeLink (srcpath, dstpath) {
    fs.link(srcpath, dstpath, err => {
      if (err) return callback(err)
      callback(null)
    })
  }

  fs.lstat(dstpath, (_, dstStat) => {
    fs.lstat(srcpath, (err, srcStat) => {
      if (err) {
        err.message = err.message.replace('lstat', 'ensureLink')
        return callback(err)
      }
      if (dstStat && areIdentical(srcStat, dstStat)) return callback(null)

      const dir = path.dirname(dstpath)
      pathExists(dir, (err, dirExists) => {
        if (err) return callback(err)
        if (dirExists) return makeLink(srcpath, dstpath)
        mkdir.mkdirs(dir, err => {
          if (err) return callback(err)
          makeLink(srcpath, dstpath)
        })
      })
    })
  })
}

function createLinkSync (srcpath, dstpath) {
  let dstStat
  try {
    dstStat = fs.lstatSync(dstpath)
  } catch {}

  try {
    const srcStat = fs.lstatSync(srcpath)
    if (dstStat && areIdentical(srcStat, dstStat)) return
  } catch (err) {
    err.message = err.message.replace('lstat', 'ensureLink')
    throw err
  }

  const dir = path.dirname(dstpath)
  const dirExists = fs.existsSync(dir)
  if (dirExists) return fs.linkSync(srcpath, dstpath)
  mkdir.mkdirsSync(dir)

  return fs.linkSync(srcpath, dstpath)
}

module.exports = {
  createLink: u(createLink),
  createLinkSync
}


/***/ }),

/***/ "./node_modules/fs-extra/lib/ensure/symlink-paths.js":
/*!***********************************************************!*\
  !*** ./node_modules/fs-extra/lib/ensure/symlink-paths.js ***!
  \***********************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


const path = __webpack_require__(/*! path */ "path")
const fs = __webpack_require__(/*! graceful-fs */ "./node_modules/graceful-fs/graceful-fs.js")
const pathExists = (__webpack_require__(/*! ../path-exists */ "./node_modules/fs-extra/lib/path-exists/index.js").pathExists)

/**
 * Function that returns two types of paths, one relative to symlink, and one
 * relative to the current working directory. Checks if path is absolute or
 * relative. If the path is relative, this function checks if the path is
 * relative to symlink or relative to current working directory. This is an
 * initiative to find a smarter `srcpath` to supply when building symlinks.
 * This allows you to determine which path to use out of one of three possible
 * types of source paths. The first is an absolute path. This is detected by
 * `path.isAbsolute()`. When an absolute path is provided, it is checked to
 * see if it exists. If it does it's used, if not an error is returned
 * (callback)/ thrown (sync). The other two options for `srcpath` are a
 * relative url. By default Node's `fs.symlink` works by creating a symlink
 * using `dstpath` and expects the `srcpath` to be relative to the newly
 * created symlink. If you provide a `srcpath` that does not exist on the file
 * system it results in a broken symlink. To minimize this, the function
 * checks to see if the 'relative to symlink' source file exists, and if it
 * does it will use it. If it does not, it checks if there's a file that
 * exists that is relative to the current working directory, if does its used.
 * This preserves the expectations of the original fs.symlink spec and adds
 * the ability to pass in `relative to current working direcotry` paths.
 */

function symlinkPaths (srcpath, dstpath, callback) {
  if (path.isAbsolute(srcpath)) {
    return fs.lstat(srcpath, (err) => {
      if (err) {
        err.message = err.message.replace('lstat', 'ensureSymlink')
        return callback(err)
      }
      return callback(null, {
        toCwd: srcpath,
        toDst: srcpath
      })
    })
  } else {
    const dstdir = path.dirname(dstpath)
    const relativeToDst = path.join(dstdir, srcpath)
    return pathExists(relativeToDst, (err, exists) => {
      if (err) return callback(err)
      if (exists) {
        return callback(null, {
          toCwd: relativeToDst,
          toDst: srcpath
        })
      } else {
        return fs.lstat(srcpath, (err) => {
          if (err) {
            err.message = err.message.replace('lstat', 'ensureSymlink')
            return callback(err)
          }
          return callback(null, {
            toCwd: srcpath,
            toDst: path.relative(dstdir, srcpath)
          })
        })
      }
    })
  }
}

function symlinkPathsSync (srcpath, dstpath) {
  let exists
  if (path.isAbsolute(srcpath)) {
    exists = fs.existsSync(srcpath)
    if (!exists) throw new Error('absolute srcpath does not exist')
    return {
      toCwd: srcpath,
      toDst: srcpath
    }
  } else {
    const dstdir = path.dirname(dstpath)
    const relativeToDst = path.join(dstdir, srcpath)
    exists = fs.existsSync(relativeToDst)
    if (exists) {
      return {
        toCwd: relativeToDst,
        toDst: srcpath
      }
    } else {
      exists = fs.existsSync(srcpath)
      if (!exists) throw new Error('relative srcpath does not exist')
      return {
        toCwd: srcpath,
        toDst: path.relative(dstdir, srcpath)
      }
    }
  }
}

module.exports = {
  symlinkPaths,
  symlinkPathsSync
}


/***/ }),

/***/ "./node_modules/fs-extra/lib/ensure/symlink-type.js":
/*!**********************************************************!*\
  !*** ./node_modules/fs-extra/lib/ensure/symlink-type.js ***!
  \**********************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


const fs = __webpack_require__(/*! graceful-fs */ "./node_modules/graceful-fs/graceful-fs.js")

function symlinkType (srcpath, type, callback) {
  callback = (typeof type === 'function') ? type : callback
  type = (typeof type === 'function') ? false : type
  if (type) return callback(null, type)
  fs.lstat(srcpath, (err, stats) => {
    if (err) return callback(null, 'file')
    type = (stats && stats.isDirectory()) ? 'dir' : 'file'
    callback(null, type)
  })
}

function symlinkTypeSync (srcpath, type) {
  let stats

  if (type) return type
  try {
    stats = fs.lstatSync(srcpath)
  } catch {
    return 'file'
  }
  return (stats && stats.isDirectory()) ? 'dir' : 'file'
}

module.exports = {
  symlinkType,
  symlinkTypeSync
}


/***/ }),

/***/ "./node_modules/fs-extra/lib/ensure/symlink.js":
/*!*****************************************************!*\
  !*** ./node_modules/fs-extra/lib/ensure/symlink.js ***!
  \*****************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


const u = (__webpack_require__(/*! universalify */ "./node_modules/universalify/index.js").fromCallback)
const path = __webpack_require__(/*! path */ "path")
const fs = __webpack_require__(/*! ../fs */ "./node_modules/fs-extra/lib/fs/index.js")
const _mkdirs = __webpack_require__(/*! ../mkdirs */ "./node_modules/fs-extra/lib/mkdirs/index.js")
const mkdirs = _mkdirs.mkdirs
const mkdirsSync = _mkdirs.mkdirsSync

const _symlinkPaths = __webpack_require__(/*! ./symlink-paths */ "./node_modules/fs-extra/lib/ensure/symlink-paths.js")
const symlinkPaths = _symlinkPaths.symlinkPaths
const symlinkPathsSync = _symlinkPaths.symlinkPathsSync

const _symlinkType = __webpack_require__(/*! ./symlink-type */ "./node_modules/fs-extra/lib/ensure/symlink-type.js")
const symlinkType = _symlinkType.symlinkType
const symlinkTypeSync = _symlinkType.symlinkTypeSync

const pathExists = (__webpack_require__(/*! ../path-exists */ "./node_modules/fs-extra/lib/path-exists/index.js").pathExists)

const { areIdentical } = __webpack_require__(/*! ../util/stat */ "./node_modules/fs-extra/lib/util/stat.js")

function createSymlink (srcpath, dstpath, type, callback) {
  callback = (typeof type === 'function') ? type : callback
  type = (typeof type === 'function') ? false : type

  fs.lstat(dstpath, (err, stats) => {
    if (!err && stats.isSymbolicLink()) {
      Promise.all([
        fs.stat(srcpath),
        fs.stat(dstpath)
      ]).then(([srcStat, dstStat]) => {
        if (areIdentical(srcStat, dstStat)) return callback(null)
        _createSymlink(srcpath, dstpath, type, callback)
      })
    } else _createSymlink(srcpath, dstpath, type, callback)
  })
}

function _createSymlink (srcpath, dstpath, type, callback) {
  symlinkPaths(srcpath, dstpath, (err, relative) => {
    if (err) return callback(err)
    srcpath = relative.toDst
    symlinkType(relative.toCwd, type, (err, type) => {
      if (err) return callback(err)
      const dir = path.dirname(dstpath)
      pathExists(dir, (err, dirExists) => {
        if (err) return callback(err)
        if (dirExists) return fs.symlink(srcpath, dstpath, type, callback)
        mkdirs(dir, err => {
          if (err) return callback(err)
          fs.symlink(srcpath, dstpath, type, callback)
        })
      })
    })
  })
}

function createSymlinkSync (srcpath, dstpath, type) {
  let stats
  try {
    stats = fs.lstatSync(dstpath)
  } catch {}
  if (stats && stats.isSymbolicLink()) {
    const srcStat = fs.statSync(srcpath)
    const dstStat = fs.statSync(dstpath)
    if (areIdentical(srcStat, dstStat)) return
  }

  const relative = symlinkPathsSync(srcpath, dstpath)
  srcpath = relative.toDst
  type = symlinkTypeSync(relative.toCwd, type)
  const dir = path.dirname(dstpath)
  const exists = fs.existsSync(dir)
  if (exists) return fs.symlinkSync(srcpath, dstpath, type)
  mkdirsSync(dir)
  return fs.symlinkSync(srcpath, dstpath, type)
}

module.exports = {
  createSymlink: u(createSymlink),
  createSymlinkSync
}


/***/ }),

/***/ "./node_modules/fs-extra/lib/fs/index.js":
/*!***********************************************!*\
  !*** ./node_modules/fs-extra/lib/fs/index.js ***!
  \***********************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

// This is adapted from https://github.com/normalize/mz
// Copyright (c) 2014-2016 Jonathan Ong me@jongleberry.com and Contributors
const u = (__webpack_require__(/*! universalify */ "./node_modules/universalify/index.js").fromCallback)
const fs = __webpack_require__(/*! graceful-fs */ "./node_modules/graceful-fs/graceful-fs.js")

const api = [
  'access',
  'appendFile',
  'chmod',
  'chown',
  'close',
  'copyFile',
  'fchmod',
  'fchown',
  'fdatasync',
  'fstat',
  'fsync',
  'ftruncate',
  'futimes',
  'lchmod',
  'lchown',
  'link',
  'lstat',
  'mkdir',
  'mkdtemp',
  'open',
  'opendir',
  'readdir',
  'readFile',
  'readlink',
  'realpath',
  'rename',
  'rm',
  'rmdir',
  'stat',
  'symlink',
  'truncate',
  'unlink',
  'utimes',
  'writeFile'
].filter(key => {
  // Some commands are not available on some systems. Ex:
  // fs.opendir was added in Node.js v12.12.0
  // fs.rm was added in Node.js v14.14.0
  // fs.lchown is not available on at least some Linux
  return typeof fs[key] === 'function'
})

// Export cloned fs:
Object.assign(exports, fs)

// Universalify async methods:
api.forEach(method => {
  exports[method] = u(fs[method])
})

// We differ from mz/fs in that we still ship the old, broken, fs.exists()
// since we are a drop-in replacement for the native module
exports.exists = function (filename, callback) {
  if (typeof callback === 'function') {
    return fs.exists(filename, callback)
  }
  return new Promise(resolve => {
    return fs.exists(filename, resolve)
  })
}

// fs.read(), fs.write(), & fs.writev() need special treatment due to multiple callback args

exports.read = function (fd, buffer, offset, length, position, callback) {
  if (typeof callback === 'function') {
    return fs.read(fd, buffer, offset, length, position, callback)
  }
  return new Promise((resolve, reject) => {
    fs.read(fd, buffer, offset, length, position, (err, bytesRead, buffer) => {
      if (err) return reject(err)
      resolve({ bytesRead, buffer })
    })
  })
}

// Function signature can be
// fs.write(fd, buffer[, offset[, length[, position]]], callback)
// OR
// fs.write(fd, string[, position[, encoding]], callback)
// We need to handle both cases, so we use ...args
exports.write = function (fd, buffer, ...args) {
  if (typeof args[args.length - 1] === 'function') {
    return fs.write(fd, buffer, ...args)
  }

  return new Promise((resolve, reject) => {
    fs.write(fd, buffer, ...args, (err, bytesWritten, buffer) => {
      if (err) return reject(err)
      resolve({ bytesWritten, buffer })
    })
  })
}

// fs.writev only available in Node v12.9.0+
if (typeof fs.writev === 'function') {
  // Function signature is
  // s.writev(fd, buffers[, position], callback)
  // We need to handle the optional arg, so we use ...args
  exports.writev = function (fd, buffers, ...args) {
    if (typeof args[args.length - 1] === 'function') {
      return fs.writev(fd, buffers, ...args)
    }

    return new Promise((resolve, reject) => {
      fs.writev(fd, buffers, ...args, (err, bytesWritten, buffers) => {
        if (err) return reject(err)
        resolve({ bytesWritten, buffers })
      })
    })
  }
}

// fs.realpath.native sometimes not available if fs is monkey-patched
if (typeof fs.realpath.native === 'function') {
  exports.realpath.native = u(fs.realpath.native)
} else {
  process.emitWarning(
    'fs.realpath.native is not a function. Is fs being monkey-patched?',
    'Warning', 'fs-extra-WARN0003'
  )
}


/***/ }),

/***/ "./node_modules/fs-extra/lib/index.js":
/*!********************************************!*\
  !*** ./node_modules/fs-extra/lib/index.js ***!
  \********************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


module.exports = {
  // Export promiseified graceful-fs:
  ...__webpack_require__(/*! ./fs */ "./node_modules/fs-extra/lib/fs/index.js"),
  // Export extra methods:
  ...__webpack_require__(/*! ./copy */ "./node_modules/fs-extra/lib/copy/index.js"),
  ...__webpack_require__(/*! ./empty */ "./node_modules/fs-extra/lib/empty/index.js"),
  ...__webpack_require__(/*! ./ensure */ "./node_modules/fs-extra/lib/ensure/index.js"),
  ...__webpack_require__(/*! ./json */ "./node_modules/fs-extra/lib/json/index.js"),
  ...__webpack_require__(/*! ./mkdirs */ "./node_modules/fs-extra/lib/mkdirs/index.js"),
  ...__webpack_require__(/*! ./move */ "./node_modules/fs-extra/lib/move/index.js"),
  ...__webpack_require__(/*! ./output-file */ "./node_modules/fs-extra/lib/output-file/index.js"),
  ...__webpack_require__(/*! ./path-exists */ "./node_modules/fs-extra/lib/path-exists/index.js"),
  ...__webpack_require__(/*! ./remove */ "./node_modules/fs-extra/lib/remove/index.js")
}


/***/ }),

/***/ "./node_modules/fs-extra/lib/json/index.js":
/*!*************************************************!*\
  !*** ./node_modules/fs-extra/lib/json/index.js ***!
  \*************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


const u = (__webpack_require__(/*! universalify */ "./node_modules/universalify/index.js").fromPromise)
const jsonFile = __webpack_require__(/*! ./jsonfile */ "./node_modules/fs-extra/lib/json/jsonfile.js")

jsonFile.outputJson = u(__webpack_require__(/*! ./output-json */ "./node_modules/fs-extra/lib/json/output-json.js"))
jsonFile.outputJsonSync = __webpack_require__(/*! ./output-json-sync */ "./node_modules/fs-extra/lib/json/output-json-sync.js")
// aliases
jsonFile.outputJSON = jsonFile.outputJson
jsonFile.outputJSONSync = jsonFile.outputJsonSync
jsonFile.writeJSON = jsonFile.writeJson
jsonFile.writeJSONSync = jsonFile.writeJsonSync
jsonFile.readJSON = jsonFile.readJson
jsonFile.readJSONSync = jsonFile.readJsonSync

module.exports = jsonFile


/***/ }),

/***/ "./node_modules/fs-extra/lib/json/jsonfile.js":
/*!****************************************************!*\
  !*** ./node_modules/fs-extra/lib/json/jsonfile.js ***!
  \****************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


const jsonFile = __webpack_require__(/*! jsonfile */ "./node_modules/jsonfile/index.js")

module.exports = {
  // jsonfile exports
  readJson: jsonFile.readFile,
  readJsonSync: jsonFile.readFileSync,
  writeJson: jsonFile.writeFile,
  writeJsonSync: jsonFile.writeFileSync
}


/***/ }),

/***/ "./node_modules/fs-extra/lib/json/output-json-sync.js":
/*!************************************************************!*\
  !*** ./node_modules/fs-extra/lib/json/output-json-sync.js ***!
  \************************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


const { stringify } = __webpack_require__(/*! jsonfile/utils */ "./node_modules/jsonfile/utils.js")
const { outputFileSync } = __webpack_require__(/*! ../output-file */ "./node_modules/fs-extra/lib/output-file/index.js")

function outputJsonSync (file, data, options) {
  const str = stringify(data, options)

  outputFileSync(file, str, options)
}

module.exports = outputJsonSync


/***/ }),

/***/ "./node_modules/fs-extra/lib/json/output-json.js":
/*!*******************************************************!*\
  !*** ./node_modules/fs-extra/lib/json/output-json.js ***!
  \*******************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


const { stringify } = __webpack_require__(/*! jsonfile/utils */ "./node_modules/jsonfile/utils.js")
const { outputFile } = __webpack_require__(/*! ../output-file */ "./node_modules/fs-extra/lib/output-file/index.js")

async function outputJson (file, data, options = {}) {
  const str = stringify(data, options)

  await outputFile(file, str, options)
}

module.exports = outputJson


/***/ }),

/***/ "./node_modules/fs-extra/lib/mkdirs/index.js":
/*!***************************************************!*\
  !*** ./node_modules/fs-extra/lib/mkdirs/index.js ***!
  \***************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";

const u = (__webpack_require__(/*! universalify */ "./node_modules/universalify/index.js").fromPromise)
const { makeDir: _makeDir, makeDirSync } = __webpack_require__(/*! ./make-dir */ "./node_modules/fs-extra/lib/mkdirs/make-dir.js")
const makeDir = u(_makeDir)

module.exports = {
  mkdirs: makeDir,
  mkdirsSync: makeDirSync,
  // alias
  mkdirp: makeDir,
  mkdirpSync: makeDirSync,
  ensureDir: makeDir,
  ensureDirSync: makeDirSync
}


/***/ }),

/***/ "./node_modules/fs-extra/lib/mkdirs/make-dir.js":
/*!******************************************************!*\
  !*** ./node_modules/fs-extra/lib/mkdirs/make-dir.js ***!
  \******************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";

const fs = __webpack_require__(/*! ../fs */ "./node_modules/fs-extra/lib/fs/index.js")
const { checkPath } = __webpack_require__(/*! ./utils */ "./node_modules/fs-extra/lib/mkdirs/utils.js")

const getMode = options => {
  const defaults = { mode: 0o777 }
  if (typeof options === 'number') return options
  return ({ ...defaults, ...options }).mode
}

module.exports.makeDir = async (dir, options) => {
  checkPath(dir)

  return fs.mkdir(dir, {
    mode: getMode(options),
    recursive: true
  })
}

module.exports.makeDirSync = (dir, options) => {
  checkPath(dir)

  return fs.mkdirSync(dir, {
    mode: getMode(options),
    recursive: true
  })
}


/***/ }),

/***/ "./node_modules/fs-extra/lib/mkdirs/utils.js":
/*!***************************************************!*\
  !*** ./node_modules/fs-extra/lib/mkdirs/utils.js ***!
  \***************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";
// Adapted from https://github.com/sindresorhus/make-dir
// Copyright (c) Sindre Sorhus <sindresorhus@gmail.com> (sindresorhus.com)
// Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
// The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

const path = __webpack_require__(/*! path */ "path")

// https://github.com/nodejs/node/issues/8987
// https://github.com/libuv/libuv/pull/1088
module.exports.checkPath = function checkPath (pth) {
  if (process.platform === 'win32') {
    const pathHasInvalidWinCharacters = /[<>:"|?*]/.test(pth.replace(path.parse(pth).root, ''))

    if (pathHasInvalidWinCharacters) {
      const error = new Error(`Path contains invalid characters: ${pth}`)
      error.code = 'EINVAL'
      throw error
    }
  }
}


/***/ }),

/***/ "./node_modules/fs-extra/lib/move/index.js":
/*!*************************************************!*\
  !*** ./node_modules/fs-extra/lib/move/index.js ***!
  \*************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


const u = (__webpack_require__(/*! universalify */ "./node_modules/universalify/index.js").fromCallback)
module.exports = {
  move: u(__webpack_require__(/*! ./move */ "./node_modules/fs-extra/lib/move/move.js")),
  moveSync: __webpack_require__(/*! ./move-sync */ "./node_modules/fs-extra/lib/move/move-sync.js")
}


/***/ }),

/***/ "./node_modules/fs-extra/lib/move/move-sync.js":
/*!*****************************************************!*\
  !*** ./node_modules/fs-extra/lib/move/move-sync.js ***!
  \*****************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


const fs = __webpack_require__(/*! graceful-fs */ "./node_modules/graceful-fs/graceful-fs.js")
const path = __webpack_require__(/*! path */ "path")
const copySync = (__webpack_require__(/*! ../copy */ "./node_modules/fs-extra/lib/copy/index.js").copySync)
const removeSync = (__webpack_require__(/*! ../remove */ "./node_modules/fs-extra/lib/remove/index.js").removeSync)
const mkdirpSync = (__webpack_require__(/*! ../mkdirs */ "./node_modules/fs-extra/lib/mkdirs/index.js").mkdirpSync)
const stat = __webpack_require__(/*! ../util/stat */ "./node_modules/fs-extra/lib/util/stat.js")

function moveSync (src, dest, opts) {
  opts = opts || {}
  const overwrite = opts.overwrite || opts.clobber || false

  const { srcStat, isChangingCase = false } = stat.checkPathsSync(src, dest, 'move', opts)
  stat.checkParentPathsSync(src, srcStat, dest, 'move')
  if (!isParentRoot(dest)) mkdirpSync(path.dirname(dest))
  return doRename(src, dest, overwrite, isChangingCase)
}

function isParentRoot (dest) {
  const parent = path.dirname(dest)
  const parsedPath = path.parse(parent)
  return parsedPath.root === parent
}

function doRename (src, dest, overwrite, isChangingCase) {
  if (isChangingCase) return rename(src, dest, overwrite)
  if (overwrite) {
    removeSync(dest)
    return rename(src, dest, overwrite)
  }
  if (fs.existsSync(dest)) throw new Error('dest already exists.')
  return rename(src, dest, overwrite)
}

function rename (src, dest, overwrite) {
  try {
    fs.renameSync(src, dest)
  } catch (err) {
    if (err.code !== 'EXDEV') throw err
    return moveAcrossDevice(src, dest, overwrite)
  }
}

function moveAcrossDevice (src, dest, overwrite) {
  const opts = {
    overwrite,
    errorOnExist: true
  }
  copySync(src, dest, opts)
  return removeSync(src)
}

module.exports = moveSync


/***/ }),

/***/ "./node_modules/fs-extra/lib/move/move.js":
/*!************************************************!*\
  !*** ./node_modules/fs-extra/lib/move/move.js ***!
  \************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


const fs = __webpack_require__(/*! graceful-fs */ "./node_modules/graceful-fs/graceful-fs.js")
const path = __webpack_require__(/*! path */ "path")
const copy = (__webpack_require__(/*! ../copy */ "./node_modules/fs-extra/lib/copy/index.js").copy)
const remove = (__webpack_require__(/*! ../remove */ "./node_modules/fs-extra/lib/remove/index.js").remove)
const mkdirp = (__webpack_require__(/*! ../mkdirs */ "./node_modules/fs-extra/lib/mkdirs/index.js").mkdirp)
const pathExists = (__webpack_require__(/*! ../path-exists */ "./node_modules/fs-extra/lib/path-exists/index.js").pathExists)
const stat = __webpack_require__(/*! ../util/stat */ "./node_modules/fs-extra/lib/util/stat.js")

function move (src, dest, opts, cb) {
  if (typeof opts === 'function') {
    cb = opts
    opts = {}
  }

  opts = opts || {}

  const overwrite = opts.overwrite || opts.clobber || false

  stat.checkPaths(src, dest, 'move', opts, (err, stats) => {
    if (err) return cb(err)
    const { srcStat, isChangingCase = false } = stats
    stat.checkParentPaths(src, srcStat, dest, 'move', err => {
      if (err) return cb(err)
      if (isParentRoot(dest)) return doRename(src, dest, overwrite, isChangingCase, cb)
      mkdirp(path.dirname(dest), err => {
        if (err) return cb(err)
        return doRename(src, dest, overwrite, isChangingCase, cb)
      })
    })
  })
}

function isParentRoot (dest) {
  const parent = path.dirname(dest)
  const parsedPath = path.parse(parent)
  return parsedPath.root === parent
}

function doRename (src, dest, overwrite, isChangingCase, cb) {
  if (isChangingCase) return rename(src, dest, overwrite, cb)
  if (overwrite) {
    return remove(dest, err => {
      if (err) return cb(err)
      return rename(src, dest, overwrite, cb)
    })
  }
  pathExists(dest, (err, destExists) => {
    if (err) return cb(err)
    if (destExists) return cb(new Error('dest already exists.'))
    return rename(src, dest, overwrite, cb)
  })
}

function rename (src, dest, overwrite, cb) {
  fs.rename(src, dest, err => {
    if (!err) return cb()
    if (err.code !== 'EXDEV') return cb(err)
    return moveAcrossDevice(src, dest, overwrite, cb)
  })
}

function moveAcrossDevice (src, dest, overwrite, cb) {
  const opts = {
    overwrite,
    errorOnExist: true
  }
  copy(src, dest, opts, err => {
    if (err) return cb(err)
    return remove(src, cb)
  })
}

module.exports = move


/***/ }),

/***/ "./node_modules/fs-extra/lib/output-file/index.js":
/*!********************************************************!*\
  !*** ./node_modules/fs-extra/lib/output-file/index.js ***!
  \********************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


const u = (__webpack_require__(/*! universalify */ "./node_modules/universalify/index.js").fromCallback)
const fs = __webpack_require__(/*! graceful-fs */ "./node_modules/graceful-fs/graceful-fs.js")
const path = __webpack_require__(/*! path */ "path")
const mkdir = __webpack_require__(/*! ../mkdirs */ "./node_modules/fs-extra/lib/mkdirs/index.js")
const pathExists = (__webpack_require__(/*! ../path-exists */ "./node_modules/fs-extra/lib/path-exists/index.js").pathExists)

function outputFile (file, data, encoding, callback) {
  if (typeof encoding === 'function') {
    callback = encoding
    encoding = 'utf8'
  }

  const dir = path.dirname(file)
  pathExists(dir, (err, itDoes) => {
    if (err) return callback(err)
    if (itDoes) return fs.writeFile(file, data, encoding, callback)

    mkdir.mkdirs(dir, err => {
      if (err) return callback(err)

      fs.writeFile(file, data, encoding, callback)
    })
  })
}

function outputFileSync (file, ...args) {
  const dir = path.dirname(file)
  if (fs.existsSync(dir)) {
    return fs.writeFileSync(file, ...args)
  }
  mkdir.mkdirsSync(dir)
  fs.writeFileSync(file, ...args)
}

module.exports = {
  outputFile: u(outputFile),
  outputFileSync
}


/***/ }),

/***/ "./node_modules/fs-extra/lib/path-exists/index.js":
/*!********************************************************!*\
  !*** ./node_modules/fs-extra/lib/path-exists/index.js ***!
  \********************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";

const u = (__webpack_require__(/*! universalify */ "./node_modules/universalify/index.js").fromPromise)
const fs = __webpack_require__(/*! ../fs */ "./node_modules/fs-extra/lib/fs/index.js")

function pathExists (path) {
  return fs.access(path).then(() => true).catch(() => false)
}

module.exports = {
  pathExists: u(pathExists),
  pathExistsSync: fs.existsSync
}


/***/ }),

/***/ "./node_modules/fs-extra/lib/remove/index.js":
/*!***************************************************!*\
  !*** ./node_modules/fs-extra/lib/remove/index.js ***!
  \***************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


const fs = __webpack_require__(/*! graceful-fs */ "./node_modules/graceful-fs/graceful-fs.js")
const u = (__webpack_require__(/*! universalify */ "./node_modules/universalify/index.js").fromCallback)
const rimraf = __webpack_require__(/*! ./rimraf */ "./node_modules/fs-extra/lib/remove/rimraf.js")

function remove (path, callback) {
  // Node 14.14.0+
  if (fs.rm) return fs.rm(path, { recursive: true, force: true }, callback)
  rimraf(path, callback)
}

function removeSync (path) {
  // Node 14.14.0+
  if (fs.rmSync) return fs.rmSync(path, { recursive: true, force: true })
  rimraf.sync(path)
}

module.exports = {
  remove: u(remove),
  removeSync
}


/***/ }),

/***/ "./node_modules/fs-extra/lib/remove/rimraf.js":
/*!****************************************************!*\
  !*** ./node_modules/fs-extra/lib/remove/rimraf.js ***!
  \****************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


const fs = __webpack_require__(/*! graceful-fs */ "./node_modules/graceful-fs/graceful-fs.js")
const path = __webpack_require__(/*! path */ "path")
const assert = __webpack_require__(/*! assert */ "assert")

const isWindows = (process.platform === 'win32')

function defaults (options) {
  const methods = [
    'unlink',
    'chmod',
    'stat',
    'lstat',
    'rmdir',
    'readdir'
  ]
  methods.forEach(m => {
    options[m] = options[m] || fs[m]
    m = m + 'Sync'
    options[m] = options[m] || fs[m]
  })

  options.maxBusyTries = options.maxBusyTries || 3
}

function rimraf (p, options, cb) {
  let busyTries = 0

  if (typeof options === 'function') {
    cb = options
    options = {}
  }

  assert(p, 'rimraf: missing path')
  assert.strictEqual(typeof p, 'string', 'rimraf: path should be a string')
  assert.strictEqual(typeof cb, 'function', 'rimraf: callback function required')
  assert(options, 'rimraf: invalid options argument provided')
  assert.strictEqual(typeof options, 'object', 'rimraf: options should be object')

  defaults(options)

  rimraf_(p, options, function CB (er) {
    if (er) {
      if ((er.code === 'EBUSY' || er.code === 'ENOTEMPTY' || er.code === 'EPERM') &&
          busyTries < options.maxBusyTries) {
        busyTries++
        const time = busyTries * 100
        // try again, with the same exact callback as this one.
        return setTimeout(() => rimraf_(p, options, CB), time)
      }

      // already gone
      if (er.code === 'ENOENT') er = null
    }

    cb(er)
  })
}

// Two possible strategies.
// 1. Assume it's a file.  unlink it, then do the dir stuff on EPERM or EISDIR
// 2. Assume it's a directory.  readdir, then do the file stuff on ENOTDIR
//
// Both result in an extra syscall when you guess wrong.  However, there
// are likely far more normal files in the world than directories.  This
// is based on the assumption that a the average number of files per
// directory is >= 1.
//
// If anyone ever complains about this, then I guess the strategy could
// be made configurable somehow.  But until then, YAGNI.
function rimraf_ (p, options, cb) {
  assert(p)
  assert(options)
  assert(typeof cb === 'function')

  // sunos lets the root user unlink directories, which is... weird.
  // so we have to lstat here and make sure it's not a dir.
  options.lstat(p, (er, st) => {
    if (er && er.code === 'ENOENT') {
      return cb(null)
    }

    // Windows can EPERM on stat.  Life is suffering.
    if (er && er.code === 'EPERM' && isWindows) {
      return fixWinEPERM(p, options, er, cb)
    }

    if (st && st.isDirectory()) {
      return rmdir(p, options, er, cb)
    }

    options.unlink(p, er => {
      if (er) {
        if (er.code === 'ENOENT') {
          return cb(null)
        }
        if (er.code === 'EPERM') {
          return (isWindows)
            ? fixWinEPERM(p, options, er, cb)
            : rmdir(p, options, er, cb)
        }
        if (er.code === 'EISDIR') {
          return rmdir(p, options, er, cb)
        }
      }
      return cb(er)
    })
  })
}

function fixWinEPERM (p, options, er, cb) {
  assert(p)
  assert(options)
  assert(typeof cb === 'function')

  options.chmod(p, 0o666, er2 => {
    if (er2) {
      cb(er2.code === 'ENOENT' ? null : er)
    } else {
      options.stat(p, (er3, stats) => {
        if (er3) {
          cb(er3.code === 'ENOENT' ? null : er)
        } else if (stats.isDirectory()) {
          rmdir(p, options, er, cb)
        } else {
          options.unlink(p, cb)
        }
      })
    }
  })
}

function fixWinEPERMSync (p, options, er) {
  let stats

  assert(p)
  assert(options)

  try {
    options.chmodSync(p, 0o666)
  } catch (er2) {
    if (er2.code === 'ENOENT') {
      return
    } else {
      throw er
    }
  }

  try {
    stats = options.statSync(p)
  } catch (er3) {
    if (er3.code === 'ENOENT') {
      return
    } else {
      throw er
    }
  }

  if (stats.isDirectory()) {
    rmdirSync(p, options, er)
  } else {
    options.unlinkSync(p)
  }
}

function rmdir (p, options, originalEr, cb) {
  assert(p)
  assert(options)
  assert(typeof cb === 'function')

  // try to rmdir first, and only readdir on ENOTEMPTY or EEXIST (SunOS)
  // if we guessed wrong, and it's not a directory, then
  // raise the original error.
  options.rmdir(p, er => {
    if (er && (er.code === 'ENOTEMPTY' || er.code === 'EEXIST' || er.code === 'EPERM')) {
      rmkids(p, options, cb)
    } else if (er && er.code === 'ENOTDIR') {
      cb(originalEr)
    } else {
      cb(er)
    }
  })
}

function rmkids (p, options, cb) {
  assert(p)
  assert(options)
  assert(typeof cb === 'function')

  options.readdir(p, (er, files) => {
    if (er) return cb(er)

    let n = files.length
    let errState

    if (n === 0) return options.rmdir(p, cb)

    files.forEach(f => {
      rimraf(path.join(p, f), options, er => {
        if (errState) {
          return
        }
        if (er) return cb(errState = er)
        if (--n === 0) {
          options.rmdir(p, cb)
        }
      })
    })
  })
}

// this looks simpler, and is strictly *faster*, but will
// tie up the JavaScript thread and fail on excessively
// deep directory trees.
function rimrafSync (p, options) {
  let st

  options = options || {}
  defaults(options)

  assert(p, 'rimraf: missing path')
  assert.strictEqual(typeof p, 'string', 'rimraf: path should be a string')
  assert(options, 'rimraf: missing options')
  assert.strictEqual(typeof options, 'object', 'rimraf: options should be object')

  try {
    st = options.lstatSync(p)
  } catch (er) {
    if (er.code === 'ENOENT') {
      return
    }

    // Windows can EPERM on stat.  Life is suffering.
    if (er.code === 'EPERM' && isWindows) {
      fixWinEPERMSync(p, options, er)
    }
  }

  try {
    // sunos lets the root user unlink directories, which is... weird.
    if (st && st.isDirectory()) {
      rmdirSync(p, options, null)
    } else {
      options.unlinkSync(p)
    }
  } catch (er) {
    if (er.code === 'ENOENT') {
      return
    } else if (er.code === 'EPERM') {
      return isWindows ? fixWinEPERMSync(p, options, er) : rmdirSync(p, options, er)
    } else if (er.code !== 'EISDIR') {
      throw er
    }
    rmdirSync(p, options, er)
  }
}

function rmdirSync (p, options, originalEr) {
  assert(p)
  assert(options)

  try {
    options.rmdirSync(p)
  } catch (er) {
    if (er.code === 'ENOTDIR') {
      throw originalEr
    } else if (er.code === 'ENOTEMPTY' || er.code === 'EEXIST' || er.code === 'EPERM') {
      rmkidsSync(p, options)
    } else if (er.code !== 'ENOENT') {
      throw er
    }
  }
}

function rmkidsSync (p, options) {
  assert(p)
  assert(options)
  options.readdirSync(p).forEach(f => rimrafSync(path.join(p, f), options))

  if (isWindows) {
    // We only end up here once we got ENOTEMPTY at least once, and
    // at this point, we are guaranteed to have removed all the kids.
    // So, we know that it won't be ENOENT or ENOTDIR or anything else.
    // try really hard to delete stuff on windows, because it has a
    // PROFOUNDLY annoying habit of not closing handles promptly when
    // files are deleted, resulting in spurious ENOTEMPTY errors.
    const startTime = Date.now()
    do {
      try {
        const ret = options.rmdirSync(p, options)
        return ret
      } catch {}
    } while (Date.now() - startTime < 500) // give up after 500ms
  } else {
    const ret = options.rmdirSync(p, options)
    return ret
  }
}

module.exports = rimraf
rimraf.sync = rimrafSync


/***/ }),

/***/ "./node_modules/fs-extra/lib/util/stat.js":
/*!************************************************!*\
  !*** ./node_modules/fs-extra/lib/util/stat.js ***!
  \************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


const fs = __webpack_require__(/*! ../fs */ "./node_modules/fs-extra/lib/fs/index.js")
const path = __webpack_require__(/*! path */ "path")
const util = __webpack_require__(/*! util */ "util")

function getStats (src, dest, opts) {
  const statFunc = opts.dereference
    ? (file) => fs.stat(file, { bigint: true })
    : (file) => fs.lstat(file, { bigint: true })
  return Promise.all([
    statFunc(src),
    statFunc(dest).catch(err => {
      if (err.code === 'ENOENT') return null
      throw err
    })
  ]).then(([srcStat, destStat]) => ({ srcStat, destStat }))
}

function getStatsSync (src, dest, opts) {
  let destStat
  const statFunc = opts.dereference
    ? (file) => fs.statSync(file, { bigint: true })
    : (file) => fs.lstatSync(file, { bigint: true })
  const srcStat = statFunc(src)
  try {
    destStat = statFunc(dest)
  } catch (err) {
    if (err.code === 'ENOENT') return { srcStat, destStat: null }
    throw err
  }
  return { srcStat, destStat }
}

function checkPaths (src, dest, funcName, opts, cb) {
  util.callbackify(getStats)(src, dest, opts, (err, stats) => {
    if (err) return cb(err)
    const { srcStat, destStat } = stats

    if (destStat) {
      if (areIdentical(srcStat, destStat)) {
        const srcBaseName = path.basename(src)
        const destBaseName = path.basename(dest)
        if (funcName === 'move' &&
          srcBaseName !== destBaseName &&
          srcBaseName.toLowerCase() === destBaseName.toLowerCase()) {
          return cb(null, { srcStat, destStat, isChangingCase: true })
        }
        return cb(new Error('Source and destination must not be the same.'))
      }
      if (srcStat.isDirectory() && !destStat.isDirectory()) {
        return cb(new Error(`Cannot overwrite non-directory '${dest}' with directory '${src}'.`))
      }
      if (!srcStat.isDirectory() && destStat.isDirectory()) {
        return cb(new Error(`Cannot overwrite directory '${dest}' with non-directory '${src}'.`))
      }
    }

    if (srcStat.isDirectory() && isSrcSubdir(src, dest)) {
      return cb(new Error(errMsg(src, dest, funcName)))
    }
    return cb(null, { srcStat, destStat })
  })
}

function checkPathsSync (src, dest, funcName, opts) {
  const { srcStat, destStat } = getStatsSync(src, dest, opts)

  if (destStat) {
    if (areIdentical(srcStat, destStat)) {
      const srcBaseName = path.basename(src)
      const destBaseName = path.basename(dest)
      if (funcName === 'move' &&
        srcBaseName !== destBaseName &&
        srcBaseName.toLowerCase() === destBaseName.toLowerCase()) {
        return { srcStat, destStat, isChangingCase: true }
      }
      throw new Error('Source and destination must not be the same.')
    }
    if (srcStat.isDirectory() && !destStat.isDirectory()) {
      throw new Error(`Cannot overwrite non-directory '${dest}' with directory '${src}'.`)
    }
    if (!srcStat.isDirectory() && destStat.isDirectory()) {
      throw new Error(`Cannot overwrite directory '${dest}' with non-directory '${src}'.`)
    }
  }

  if (srcStat.isDirectory() && isSrcSubdir(src, dest)) {
    throw new Error(errMsg(src, dest, funcName))
  }
  return { srcStat, destStat }
}

// recursively check if dest parent is a subdirectory of src.
// It works for all file types including symlinks since it
// checks the src and dest inodes. It starts from the deepest
// parent and stops once it reaches the src parent or the root path.
function checkParentPaths (src, srcStat, dest, funcName, cb) {
  const srcParent = path.resolve(path.dirname(src))
  const destParent = path.resolve(path.dirname(dest))
  if (destParent === srcParent || destParent === path.parse(destParent).root) return cb()
  fs.stat(destParent, { bigint: true }, (err, destStat) => {
    if (err) {
      if (err.code === 'ENOENT') return cb()
      return cb(err)
    }
    if (areIdentical(srcStat, destStat)) {
      return cb(new Error(errMsg(src, dest, funcName)))
    }
    return checkParentPaths(src, srcStat, destParent, funcName, cb)
  })
}

function checkParentPathsSync (src, srcStat, dest, funcName) {
  const srcParent = path.resolve(path.dirname(src))
  const destParent = path.resolve(path.dirname(dest))
  if (destParent === srcParent || destParent === path.parse(destParent).root) return
  let destStat
  try {
    destStat = fs.statSync(destParent, { bigint: true })
  } catch (err) {
    if (err.code === 'ENOENT') return
    throw err
  }
  if (areIdentical(srcStat, destStat)) {
    throw new Error(errMsg(src, dest, funcName))
  }
  return checkParentPathsSync(src, srcStat, destParent, funcName)
}

function areIdentical (srcStat, destStat) {
  return destStat.ino && destStat.dev && destStat.ino === srcStat.ino && destStat.dev === srcStat.dev
}

// return true if dest is a subdir of src, otherwise false.
// It only checks the path strings.
function isSrcSubdir (src, dest) {
  const srcArr = path.resolve(src).split(path.sep).filter(i => i)
  const destArr = path.resolve(dest).split(path.sep).filter(i => i)
  return srcArr.reduce((acc, cur, i) => acc && destArr[i] === cur, true)
}

function errMsg (src, dest, funcName) {
  return `Cannot ${funcName} '${src}' to a subdirectory of itself, '${dest}'.`
}

module.exports = {
  checkPaths,
  checkPathsSync,
  checkParentPaths,
  checkParentPathsSync,
  isSrcSubdir,
  areIdentical
}


/***/ }),

/***/ "./node_modules/fs-extra/lib/util/utimes.js":
/*!**************************************************!*\
  !*** ./node_modules/fs-extra/lib/util/utimes.js ***!
  \**************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


const fs = __webpack_require__(/*! graceful-fs */ "./node_modules/graceful-fs/graceful-fs.js")

function utimesMillis (path, atime, mtime, callback) {
  // if (!HAS_MILLIS_RES) return fs.utimes(path, atime, mtime, callback)
  fs.open(path, 'r+', (err, fd) => {
    if (err) return callback(err)
    fs.futimes(fd, atime, mtime, futimesErr => {
      fs.close(fd, closeErr => {
        if (callback) callback(futimesErr || closeErr)
      })
    })
  })
}

function utimesMillisSync (path, atime, mtime) {
  const fd = fs.openSync(path, 'r+')
  fs.futimesSync(fd, atime, mtime)
  return fs.closeSync(fd)
}

module.exports = {
  utimesMillis,
  utimesMillisSync
}


/***/ }),

/***/ "./node_modules/graceful-fs/clone.js":
/*!*******************************************!*\
  !*** ./node_modules/graceful-fs/clone.js ***!
  \*******************************************/
/***/ ((module) => {

"use strict";


module.exports = clone

var getPrototypeOf = Object.getPrototypeOf || function (obj) {
  return obj.__proto__
}

function clone (obj) {
  if (obj === null || typeof obj !== 'object')
    return obj

  if (obj instanceof Object)
    var copy = { __proto__: getPrototypeOf(obj) }
  else
    var copy = Object.create(null)

  Object.getOwnPropertyNames(obj).forEach(function (key) {
    Object.defineProperty(copy, key, Object.getOwnPropertyDescriptor(obj, key))
  })

  return copy
}


/***/ }),

/***/ "./node_modules/graceful-fs/graceful-fs.js":
/*!*************************************************!*\
  !*** ./node_modules/graceful-fs/graceful-fs.js ***!
  \*************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var fs = __webpack_require__(/*! fs */ "fs")
var polyfills = __webpack_require__(/*! ./polyfills.js */ "./node_modules/graceful-fs/polyfills.js")
var legacy = __webpack_require__(/*! ./legacy-streams.js */ "./node_modules/graceful-fs/legacy-streams.js")
var clone = __webpack_require__(/*! ./clone.js */ "./node_modules/graceful-fs/clone.js")

var util = __webpack_require__(/*! util */ "util")

/* istanbul ignore next - node 0.x polyfill */
var gracefulQueue
var previousSymbol

/* istanbul ignore else - node 0.x polyfill */
if (typeof Symbol === 'function' && typeof Symbol.for === 'function') {
  gracefulQueue = Symbol.for('graceful-fs.queue')
  // This is used in testing by future versions
  previousSymbol = Symbol.for('graceful-fs.previous')
} else {
  gracefulQueue = '___graceful-fs.queue'
  previousSymbol = '___graceful-fs.previous'
}

function noop () {}

function publishQueue(context, queue) {
  Object.defineProperty(context, gracefulQueue, {
    get: function() {
      return queue
    }
  })
}

var debug = noop
if (util.debuglog)
  debug = util.debuglog('gfs4')
else if (/\bgfs4\b/i.test(process.env.NODE_DEBUG || ''))
  debug = function() {
    var m = util.format.apply(util, arguments)
    m = 'GFS4: ' + m.split(/\n/).join('\nGFS4: ')
    console.error(m)
  }

// Once time initialization
if (!fs[gracefulQueue]) {
  // This queue can be shared by multiple loaded instances
  var queue = global[gracefulQueue] || []
  publishQueue(fs, queue)

  // Patch fs.close/closeSync to shared queue version, because we need
  // to retry() whenever a close happens *anywhere* in the program.
  // This is essential when multiple graceful-fs instances are
  // in play at the same time.
  fs.close = (function (fs$close) {
    function close (fd, cb) {
      return fs$close.call(fs, fd, function (err) {
        // This function uses the graceful-fs shared queue
        if (!err) {
          resetQueue()
        }

        if (typeof cb === 'function')
          cb.apply(this, arguments)
      })
    }

    Object.defineProperty(close, previousSymbol, {
      value: fs$close
    })
    return close
  })(fs.close)

  fs.closeSync = (function (fs$closeSync) {
    function closeSync (fd) {
      // This function uses the graceful-fs shared queue
      fs$closeSync.apply(fs, arguments)
      resetQueue()
    }

    Object.defineProperty(closeSync, previousSymbol, {
      value: fs$closeSync
    })
    return closeSync
  })(fs.closeSync)

  if (/\bgfs4\b/i.test(process.env.NODE_DEBUG || '')) {
    process.on('exit', function() {
      debug(fs[gracefulQueue])
      __webpack_require__(/*! assert */ "assert").equal(fs[gracefulQueue].length, 0)
    })
  }
}

if (!global[gracefulQueue]) {
  publishQueue(global, fs[gracefulQueue]);
}

module.exports = patch(clone(fs))
if (process.env.TEST_GRACEFUL_FS_GLOBAL_PATCH && !fs.__patched) {
    module.exports = patch(fs)
    fs.__patched = true;
}

function patch (fs) {
  // Everything that references the open() function needs to be in here
  polyfills(fs)
  fs.gracefulify = patch

  fs.createReadStream = createReadStream
  fs.createWriteStream = createWriteStream
  var fs$readFile = fs.readFile
  fs.readFile = readFile
  function readFile (path, options, cb) {
    if (typeof options === 'function')
      cb = options, options = null

    return go$readFile(path, options, cb)

    function go$readFile (path, options, cb, startTime) {
      return fs$readFile(path, options, function (err) {
        if (err && (err.code === 'EMFILE' || err.code === 'ENFILE'))
          enqueue([go$readFile, [path, options, cb], err, startTime || Date.now(), Date.now()])
        else {
          if (typeof cb === 'function')
            cb.apply(this, arguments)
        }
      })
    }
  }

  var fs$writeFile = fs.writeFile
  fs.writeFile = writeFile
  function writeFile (path, data, options, cb) {
    if (typeof options === 'function')
      cb = options, options = null

    return go$writeFile(path, data, options, cb)

    function go$writeFile (path, data, options, cb, startTime) {
      return fs$writeFile(path, data, options, function (err) {
        if (err && (err.code === 'EMFILE' || err.code === 'ENFILE'))
          enqueue([go$writeFile, [path, data, options, cb], err, startTime || Date.now(), Date.now()])
        else {
          if (typeof cb === 'function')
            cb.apply(this, arguments)
        }
      })
    }
  }

  var fs$appendFile = fs.appendFile
  if (fs$appendFile)
    fs.appendFile = appendFile
  function appendFile (path, data, options, cb) {
    if (typeof options === 'function')
      cb = options, options = null

    return go$appendFile(path, data, options, cb)

    function go$appendFile (path, data, options, cb, startTime) {
      return fs$appendFile(path, data, options, function (err) {
        if (err && (err.code === 'EMFILE' || err.code === 'ENFILE'))
          enqueue([go$appendFile, [path, data, options, cb], err, startTime || Date.now(), Date.now()])
        else {
          if (typeof cb === 'function')
            cb.apply(this, arguments)
        }
      })
    }
  }

  var fs$copyFile = fs.copyFile
  if (fs$copyFile)
    fs.copyFile = copyFile
  function copyFile (src, dest, flags, cb) {
    if (typeof flags === 'function') {
      cb = flags
      flags = 0
    }
    return go$copyFile(src, dest, flags, cb)

    function go$copyFile (src, dest, flags, cb, startTime) {
      return fs$copyFile(src, dest, flags, function (err) {
        if (err && (err.code === 'EMFILE' || err.code === 'ENFILE'))
          enqueue([go$copyFile, [src, dest, flags, cb], err, startTime || Date.now(), Date.now()])
        else {
          if (typeof cb === 'function')
            cb.apply(this, arguments)
        }
      })
    }
  }

  var fs$readdir = fs.readdir
  fs.readdir = readdir
  var noReaddirOptionVersions = /^v[0-5]\./
  function readdir (path, options, cb) {
    if (typeof options === 'function')
      cb = options, options = null

    var go$readdir = noReaddirOptionVersions.test(process.version)
      ? function go$readdir (path, options, cb, startTime) {
        return fs$readdir(path, fs$readdirCallback(
          path, options, cb, startTime
        ))
      }
      : function go$readdir (path, options, cb, startTime) {
        return fs$readdir(path, options, fs$readdirCallback(
          path, options, cb, startTime
        ))
      }

    return go$readdir(path, options, cb)

    function fs$readdirCallback (path, options, cb, startTime) {
      return function (err, files) {
        if (err && (err.code === 'EMFILE' || err.code === 'ENFILE'))
          enqueue([
            go$readdir,
            [path, options, cb],
            err,
            startTime || Date.now(),
            Date.now()
          ])
        else {
          if (files && files.sort)
            files.sort()

          if (typeof cb === 'function')
            cb.call(this, err, files)
        }
      }
    }
  }

  if (process.version.substr(0, 4) === 'v0.8') {
    var legStreams = legacy(fs)
    ReadStream = legStreams.ReadStream
    WriteStream = legStreams.WriteStream
  }

  var fs$ReadStream = fs.ReadStream
  if (fs$ReadStream) {
    ReadStream.prototype = Object.create(fs$ReadStream.prototype)
    ReadStream.prototype.open = ReadStream$open
  }

  var fs$WriteStream = fs.WriteStream
  if (fs$WriteStream) {
    WriteStream.prototype = Object.create(fs$WriteStream.prototype)
    WriteStream.prototype.open = WriteStream$open
  }

  Object.defineProperty(fs, 'ReadStream', {
    get: function () {
      return ReadStream
    },
    set: function (val) {
      ReadStream = val
    },
    enumerable: true,
    configurable: true
  })
  Object.defineProperty(fs, 'WriteStream', {
    get: function () {
      return WriteStream
    },
    set: function (val) {
      WriteStream = val
    },
    enumerable: true,
    configurable: true
  })

  // legacy names
  var FileReadStream = ReadStream
  Object.defineProperty(fs, 'FileReadStream', {
    get: function () {
      return FileReadStream
    },
    set: function (val) {
      FileReadStream = val
    },
    enumerable: true,
    configurable: true
  })
  var FileWriteStream = WriteStream
  Object.defineProperty(fs, 'FileWriteStream', {
    get: function () {
      return FileWriteStream
    },
    set: function (val) {
      FileWriteStream = val
    },
    enumerable: true,
    configurable: true
  })

  function ReadStream (path, options) {
    if (this instanceof ReadStream)
      return fs$ReadStream.apply(this, arguments), this
    else
      return ReadStream.apply(Object.create(ReadStream.prototype), arguments)
  }

  function ReadStream$open () {
    var that = this
    open(that.path, that.flags, that.mode, function (err, fd) {
      if (err) {
        if (that.autoClose)
          that.destroy()

        that.emit('error', err)
      } else {
        that.fd = fd
        that.emit('open', fd)
        that.read()
      }
    })
  }

  function WriteStream (path, options) {
    if (this instanceof WriteStream)
      return fs$WriteStream.apply(this, arguments), this
    else
      return WriteStream.apply(Object.create(WriteStream.prototype), arguments)
  }

  function WriteStream$open () {
    var that = this
    open(that.path, that.flags, that.mode, function (err, fd) {
      if (err) {
        that.destroy()
        that.emit('error', err)
      } else {
        that.fd = fd
        that.emit('open', fd)
      }
    })
  }

  function createReadStream (path, options) {
    return new fs.ReadStream(path, options)
  }

  function createWriteStream (path, options) {
    return new fs.WriteStream(path, options)
  }

  var fs$open = fs.open
  fs.open = open
  function open (path, flags, mode, cb) {
    if (typeof mode === 'function')
      cb = mode, mode = null

    return go$open(path, flags, mode, cb)

    function go$open (path, flags, mode, cb, startTime) {
      return fs$open(path, flags, mode, function (err, fd) {
        if (err && (err.code === 'EMFILE' || err.code === 'ENFILE'))
          enqueue([go$open, [path, flags, mode, cb], err, startTime || Date.now(), Date.now()])
        else {
          if (typeof cb === 'function')
            cb.apply(this, arguments)
        }
      })
    }
  }

  return fs
}

function enqueue (elem) {
  debug('ENQUEUE', elem[0].name, elem[1])
  fs[gracefulQueue].push(elem)
  retry()
}

// keep track of the timeout between retry() calls
var retryTimer

// reset the startTime and lastTime to now
// this resets the start of the 60 second overall timeout as well as the
// delay between attempts so that we'll retry these jobs sooner
function resetQueue () {
  var now = Date.now()
  for (var i = 0; i < fs[gracefulQueue].length; ++i) {
    // entries that are only a length of 2 are from an older version, don't
    // bother modifying those since they'll be retried anyway.
    if (fs[gracefulQueue][i].length > 2) {
      fs[gracefulQueue][i][3] = now // startTime
      fs[gracefulQueue][i][4] = now // lastTime
    }
  }
  // call retry to make sure we're actively processing the queue
  retry()
}

function retry () {
  // clear the timer and remove it to help prevent unintended concurrency
  clearTimeout(retryTimer)
  retryTimer = undefined

  if (fs[gracefulQueue].length === 0)
    return

  var elem = fs[gracefulQueue].shift()
  var fn = elem[0]
  var args = elem[1]
  // these items may be unset if they were added by an older graceful-fs
  var err = elem[2]
  var startTime = elem[3]
  var lastTime = elem[4]

  // if we don't have a startTime we have no way of knowing if we've waited
  // long enough, so go ahead and retry this item now
  if (startTime === undefined) {
    debug('RETRY', fn.name, args)
    fn.apply(null, args)
  } else if (Date.now() - startTime >= 60000) {
    // it's been more than 60 seconds total, bail now
    debug('TIMEOUT', fn.name, args)
    var cb = args.pop()
    if (typeof cb === 'function')
      cb.call(null, err)
  } else {
    // the amount of time between the last attempt and right now
    var sinceAttempt = Date.now() - lastTime
    // the amount of time between when we first tried, and when we last tried
    // rounded up to at least 1
    var sinceStart = Math.max(lastTime - startTime, 1)
    // backoff. wait longer than the total time we've been retrying, but only
    // up to a maximum of 100ms
    var desiredDelay = Math.min(sinceStart * 1.2, 100)
    // it's been long enough since the last retry, do it again
    if (sinceAttempt >= desiredDelay) {
      debug('RETRY', fn.name, args)
      fn.apply(null, args.concat([startTime]))
    } else {
      // if we can't do this job yet, push it to the end of the queue
      // and let the next iteration check again
      fs[gracefulQueue].push(elem)
    }
  }

  // schedule our next run if one isn't already scheduled
  if (retryTimer === undefined) {
    retryTimer = setTimeout(retry, 0)
  }
}


/***/ }),

/***/ "./node_modules/graceful-fs/legacy-streams.js":
/*!****************************************************!*\
  !*** ./node_modules/graceful-fs/legacy-streams.js ***!
  \****************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var Stream = (__webpack_require__(/*! stream */ "stream").Stream)

module.exports = legacy

function legacy (fs) {
  return {
    ReadStream: ReadStream,
    WriteStream: WriteStream
  }

  function ReadStream (path, options) {
    if (!(this instanceof ReadStream)) return new ReadStream(path, options);

    Stream.call(this);

    var self = this;

    this.path = path;
    this.fd = null;
    this.readable = true;
    this.paused = false;

    this.flags = 'r';
    this.mode = 438; /*=0666*/
    this.bufferSize = 64 * 1024;

    options = options || {};

    // Mixin options into this
    var keys = Object.keys(options);
    for (var index = 0, length = keys.length; index < length; index++) {
      var key = keys[index];
      this[key] = options[key];
    }

    if (this.encoding) this.setEncoding(this.encoding);

    if (this.start !== undefined) {
      if ('number' !== typeof this.start) {
        throw TypeError('start must be a Number');
      }
      if (this.end === undefined) {
        this.end = Infinity;
      } else if ('number' !== typeof this.end) {
        throw TypeError('end must be a Number');
      }

      if (this.start > this.end) {
        throw new Error('start must be <= end');
      }

      this.pos = this.start;
    }

    if (this.fd !== null) {
      process.nextTick(function() {
        self._read();
      });
      return;
    }

    fs.open(this.path, this.flags, this.mode, function (err, fd) {
      if (err) {
        self.emit('error', err);
        self.readable = false;
        return;
      }

      self.fd = fd;
      self.emit('open', fd);
      self._read();
    })
  }

  function WriteStream (path, options) {
    if (!(this instanceof WriteStream)) return new WriteStream(path, options);

    Stream.call(this);

    this.path = path;
    this.fd = null;
    this.writable = true;

    this.flags = 'w';
    this.encoding = 'binary';
    this.mode = 438; /*=0666*/
    this.bytesWritten = 0;

    options = options || {};

    // Mixin options into this
    var keys = Object.keys(options);
    for (var index = 0, length = keys.length; index < length; index++) {
      var key = keys[index];
      this[key] = options[key];
    }

    if (this.start !== undefined) {
      if ('number' !== typeof this.start) {
        throw TypeError('start must be a Number');
      }
      if (this.start < 0) {
        throw new Error('start must be >= zero');
      }

      this.pos = this.start;
    }

    this.busy = false;
    this._queue = [];

    if (this.fd === null) {
      this._open = fs.open;
      this._queue.push([this._open, this.path, this.flags, this.mode, undefined]);
      this.flush();
    }
  }
}


/***/ }),

/***/ "./node_modules/graceful-fs/polyfills.js":
/*!***********************************************!*\
  !*** ./node_modules/graceful-fs/polyfills.js ***!
  \***********************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var constants = __webpack_require__(/*! constants */ "constants")

var origCwd = process.cwd
var cwd = null

var platform = process.env.GRACEFUL_FS_PLATFORM || process.platform

process.cwd = function() {
  if (!cwd)
    cwd = origCwd.call(process)
  return cwd
}
try {
  process.cwd()
} catch (er) {}

// This check is needed until node.js 12 is required
if (typeof process.chdir === 'function') {
  var chdir = process.chdir
  process.chdir = function (d) {
    cwd = null
    chdir.call(process, d)
  }
  if (Object.setPrototypeOf) Object.setPrototypeOf(process.chdir, chdir)
}

module.exports = patch

function patch (fs) {
  // (re-)implement some things that are known busted or missing.

  // lchmod, broken prior to 0.6.2
  // back-port the fix here.
  if (constants.hasOwnProperty('O_SYMLINK') &&
      process.version.match(/^v0\.6\.[0-2]|^v0\.5\./)) {
    patchLchmod(fs)
  }

  // lutimes implementation, or no-op
  if (!fs.lutimes) {
    patchLutimes(fs)
  }

  // https://github.com/isaacs/node-graceful-fs/issues/4
  // Chown should not fail on einval or eperm if non-root.
  // It should not fail on enosys ever, as this just indicates
  // that a fs doesn't support the intended operation.

  fs.chown = chownFix(fs.chown)
  fs.fchown = chownFix(fs.fchown)
  fs.lchown = chownFix(fs.lchown)

  fs.chmod = chmodFix(fs.chmod)
  fs.fchmod = chmodFix(fs.fchmod)
  fs.lchmod = chmodFix(fs.lchmod)

  fs.chownSync = chownFixSync(fs.chownSync)
  fs.fchownSync = chownFixSync(fs.fchownSync)
  fs.lchownSync = chownFixSync(fs.lchownSync)

  fs.chmodSync = chmodFixSync(fs.chmodSync)
  fs.fchmodSync = chmodFixSync(fs.fchmodSync)
  fs.lchmodSync = chmodFixSync(fs.lchmodSync)

  fs.stat = statFix(fs.stat)
  fs.fstat = statFix(fs.fstat)
  fs.lstat = statFix(fs.lstat)

  fs.statSync = statFixSync(fs.statSync)
  fs.fstatSync = statFixSync(fs.fstatSync)
  fs.lstatSync = statFixSync(fs.lstatSync)

  // if lchmod/lchown do not exist, then make them no-ops
  if (fs.chmod && !fs.lchmod) {
    fs.lchmod = function (path, mode, cb) {
      if (cb) process.nextTick(cb)
    }
    fs.lchmodSync = function () {}
  }
  if (fs.chown && !fs.lchown) {
    fs.lchown = function (path, uid, gid, cb) {
      if (cb) process.nextTick(cb)
    }
    fs.lchownSync = function () {}
  }

  // on Windows, A/V software can lock the directory, causing this
  // to fail with an EACCES or EPERM if the directory contains newly
  // created files.  Try again on failure, for up to 60 seconds.

  // Set the timeout this long because some Windows Anti-Virus, such as Parity
  // bit9, may lock files for up to a minute, causing npm package install
  // failures. Also, take care to yield the scheduler. Windows scheduling gives
  // CPU to a busy looping process, which can cause the program causing the lock
  // contention to be starved of CPU by node, so the contention doesn't resolve.
  if (platform === "win32") {
    fs.rename = typeof fs.rename !== 'function' ? fs.rename
    : (function (fs$rename) {
      function rename (from, to, cb) {
        var start = Date.now()
        var backoff = 0;
        fs$rename(from, to, function CB (er) {
          if (er
              && (er.code === "EACCES" || er.code === "EPERM")
              && Date.now() - start < 60000) {
            setTimeout(function() {
              fs.stat(to, function (stater, st) {
                if (stater && stater.code === "ENOENT")
                  fs$rename(from, to, CB);
                else
                  cb(er)
              })
            }, backoff)
            if (backoff < 100)
              backoff += 10;
            return;
          }
          if (cb) cb(er)
        })
      }
      if (Object.setPrototypeOf) Object.setPrototypeOf(rename, fs$rename)
      return rename
    })(fs.rename)
  }

  // if read() returns EAGAIN, then just try it again.
  fs.read = typeof fs.read !== 'function' ? fs.read
  : (function (fs$read) {
    function read (fd, buffer, offset, length, position, callback_) {
      var callback
      if (callback_ && typeof callback_ === 'function') {
        var eagCounter = 0
        callback = function (er, _, __) {
          if (er && er.code === 'EAGAIN' && eagCounter < 10) {
            eagCounter ++
            return fs$read.call(fs, fd, buffer, offset, length, position, callback)
          }
          callback_.apply(this, arguments)
        }
      }
      return fs$read.call(fs, fd, buffer, offset, length, position, callback)
    }

    // This ensures `util.promisify` works as it does for native `fs.read`.
    if (Object.setPrototypeOf) Object.setPrototypeOf(read, fs$read)
    return read
  })(fs.read)

  fs.readSync = typeof fs.readSync !== 'function' ? fs.readSync
  : (function (fs$readSync) { return function (fd, buffer, offset, length, position) {
    var eagCounter = 0
    while (true) {
      try {
        return fs$readSync.call(fs, fd, buffer, offset, length, position)
      } catch (er) {
        if (er.code === 'EAGAIN' && eagCounter < 10) {
          eagCounter ++
          continue
        }
        throw er
      }
    }
  }})(fs.readSync)

  function patchLchmod (fs) {
    fs.lchmod = function (path, mode, callback) {
      fs.open( path
             , constants.O_WRONLY | constants.O_SYMLINK
             , mode
             , function (err, fd) {
        if (err) {
          if (callback) callback(err)
          return
        }
        // prefer to return the chmod error, if one occurs,
        // but still try to close, and report closing errors if they occur.
        fs.fchmod(fd, mode, function (err) {
          fs.close(fd, function(err2) {
            if (callback) callback(err || err2)
          })
        })
      })
    }

    fs.lchmodSync = function (path, mode) {
      var fd = fs.openSync(path, constants.O_WRONLY | constants.O_SYMLINK, mode)

      // prefer to return the chmod error, if one occurs,
      // but still try to close, and report closing errors if they occur.
      var threw = true
      var ret
      try {
        ret = fs.fchmodSync(fd, mode)
        threw = false
      } finally {
        if (threw) {
          try {
            fs.closeSync(fd)
          } catch (er) {}
        } else {
          fs.closeSync(fd)
        }
      }
      return ret
    }
  }

  function patchLutimes (fs) {
    if (constants.hasOwnProperty("O_SYMLINK") && fs.futimes) {
      fs.lutimes = function (path, at, mt, cb) {
        fs.open(path, constants.O_SYMLINK, function (er, fd) {
          if (er) {
            if (cb) cb(er)
            return
          }
          fs.futimes(fd, at, mt, function (er) {
            fs.close(fd, function (er2) {
              if (cb) cb(er || er2)
            })
          })
        })
      }

      fs.lutimesSync = function (path, at, mt) {
        var fd = fs.openSync(path, constants.O_SYMLINK)
        var ret
        var threw = true
        try {
          ret = fs.futimesSync(fd, at, mt)
          threw = false
        } finally {
          if (threw) {
            try {
              fs.closeSync(fd)
            } catch (er) {}
          } else {
            fs.closeSync(fd)
          }
        }
        return ret
      }

    } else if (fs.futimes) {
      fs.lutimes = function (_a, _b, _c, cb) { if (cb) process.nextTick(cb) }
      fs.lutimesSync = function () {}
    }
  }

  function chmodFix (orig) {
    if (!orig) return orig
    return function (target, mode, cb) {
      return orig.call(fs, target, mode, function (er) {
        if (chownErOk(er)) er = null
        if (cb) cb.apply(this, arguments)
      })
    }
  }

  function chmodFixSync (orig) {
    if (!orig) return orig
    return function (target, mode) {
      try {
        return orig.call(fs, target, mode)
      } catch (er) {
        if (!chownErOk(er)) throw er
      }
    }
  }


  function chownFix (orig) {
    if (!orig) return orig
    return function (target, uid, gid, cb) {
      return orig.call(fs, target, uid, gid, function (er) {
        if (chownErOk(er)) er = null
        if (cb) cb.apply(this, arguments)
      })
    }
  }

  function chownFixSync (orig) {
    if (!orig) return orig
    return function (target, uid, gid) {
      try {
        return orig.call(fs, target, uid, gid)
      } catch (er) {
        if (!chownErOk(er)) throw er
      }
    }
  }

  function statFix (orig) {
    if (!orig) return orig
    // Older versions of Node erroneously returned signed integers for
    // uid + gid.
    return function (target, options, cb) {
      if (typeof options === 'function') {
        cb = options
        options = null
      }
      function callback (er, stats) {
        if (stats) {
          if (stats.uid < 0) stats.uid += 0x100000000
          if (stats.gid < 0) stats.gid += 0x100000000
        }
        if (cb) cb.apply(this, arguments)
      }
      return options ? orig.call(fs, target, options, callback)
        : orig.call(fs, target, callback)
    }
  }

  function statFixSync (orig) {
    if (!orig) return orig
    // Older versions of Node erroneously returned signed integers for
    // uid + gid.
    return function (target, options) {
      var stats = options ? orig.call(fs, target, options)
        : orig.call(fs, target)
      if (stats) {
        if (stats.uid < 0) stats.uid += 0x100000000
        if (stats.gid < 0) stats.gid += 0x100000000
      }
      return stats;
    }
  }

  // ENOSYS means that the fs doesn't support the op. Just ignore
  // that, because it doesn't matter.
  //
  // if there's no getuid, or if getuid() is something other
  // than 0, and the error is EINVAL or EPERM, then just ignore
  // it.
  //
  // This specific case is a silent failure in cp, install, tar,
  // and most other unix tools that manage permissions.
  //
  // When running as root, or if other types of errors are
  // encountered, then it's strict.
  function chownErOk (er) {
    if (!er)
      return true

    if (er.code === "ENOSYS")
      return true

    var nonroot = !process.getuid || process.getuid() !== 0
    if (nonroot) {
      if (er.code === "EINVAL" || er.code === "EPERM")
        return true
    }

    return false
  }
}


/***/ }),

/***/ "./node_modules/jsonfile/index.js":
/*!****************************************!*\
  !*** ./node_modules/jsonfile/index.js ***!
  \****************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

let _fs
try {
  _fs = __webpack_require__(/*! graceful-fs */ "./node_modules/graceful-fs/graceful-fs.js")
} catch (_) {
  _fs = __webpack_require__(/*! fs */ "fs")
}
const universalify = __webpack_require__(/*! universalify */ "./node_modules/universalify/index.js")
const { stringify, stripBom } = __webpack_require__(/*! ./utils */ "./node_modules/jsonfile/utils.js")

async function _readFile (file, options = {}) {
  if (typeof options === 'string') {
    options = { encoding: options }
  }

  const fs = options.fs || _fs

  const shouldThrow = 'throws' in options ? options.throws : true

  let data = await universalify.fromCallback(fs.readFile)(file, options)

  data = stripBom(data)

  let obj
  try {
    obj = JSON.parse(data, options ? options.reviver : null)
  } catch (err) {
    if (shouldThrow) {
      err.message = `${file}: ${err.message}`
      throw err
    } else {
      return null
    }
  }

  return obj
}

const readFile = universalify.fromPromise(_readFile)

function readFileSync (file, options = {}) {
  if (typeof options === 'string') {
    options = { encoding: options }
  }

  const fs = options.fs || _fs

  const shouldThrow = 'throws' in options ? options.throws : true

  try {
    let content = fs.readFileSync(file, options)
    content = stripBom(content)
    return JSON.parse(content, options.reviver)
  } catch (err) {
    if (shouldThrow) {
      err.message = `${file}: ${err.message}`
      throw err
    } else {
      return null
    }
  }
}

async function _writeFile (file, obj, options = {}) {
  const fs = options.fs || _fs

  const str = stringify(obj, options)

  await universalify.fromCallback(fs.writeFile)(file, str, options)
}

const writeFile = universalify.fromPromise(_writeFile)

function writeFileSync (file, obj, options = {}) {
  const fs = options.fs || _fs

  const str = stringify(obj, options)
  // not sure if fs.writeFileSync returns anything, but just in case
  return fs.writeFileSync(file, str, options)
}

const jsonfile = {
  readFile,
  readFileSync,
  writeFile,
  writeFileSync
}

module.exports = jsonfile


/***/ }),

/***/ "./node_modules/jsonfile/utils.js":
/*!****************************************!*\
  !*** ./node_modules/jsonfile/utils.js ***!
  \****************************************/
/***/ ((module) => {

function stringify (obj, { EOL = '\n', finalEOL = true, replacer = null, spaces } = {}) {
  const EOF = finalEOL ? EOL : ''
  const str = JSON.stringify(obj, replacer, spaces)

  return str.replace(/\n/g, EOL) + EOF
}

function stripBom (content) {
  // we do this because JSON.parse would convert it to a utf8 string if encoding wasn't specified
  if (Buffer.isBuffer(content)) content = content.toString('utf8')
  return content.replace(/^\uFEFF/, '')
}

module.exports = { stringify, stripBom }


/***/ }),

/***/ "./node_modules/leven/index.js":
/*!*************************************!*\
  !*** ./node_modules/leven/index.js ***!
  \*************************************/
/***/ ((module) => {

"use strict";
/* eslint-disable no-nested-ternary */

var arr = [];
var charCodeCache = [];

module.exports = function (a, b) {
	if (a === b) {
		return 0;
	}

	var swap = a;

	// Swapping the strings if `a` is longer than `b` so we know which one is the
	// shortest & which one is the longest
	if (a.length > b.length) {
		a = b;
		b = swap;
	}

	var aLen = a.length;
	var bLen = b.length;

	if (aLen === 0) {
		return bLen;
	}

	if (bLen === 0) {
		return aLen;
	}

	// Performing suffix trimming:
	// We can linearly drop suffix common to both strings since they
	// don't increase distance at all
	// Note: `~-` is the bitwise way to perform a `- 1` operation
	while (aLen > 0 && (a.charCodeAt(~-aLen) === b.charCodeAt(~-bLen))) {
		aLen--;
		bLen--;
	}

	if (aLen === 0) {
		return bLen;
	}

	// Performing prefix trimming
	// We can linearly drop prefix common to both strings since they
	// don't increase distance at all
	var start = 0;

	while (start < aLen && (a.charCodeAt(start) === b.charCodeAt(start))) {
		start++;
	}

	aLen -= start;
	bLen -= start;

	if (aLen === 0) {
		return bLen;
	}

	var bCharCode;
	var ret;
	var tmp;
	var tmp2;
	var i = 0;
	var j = 0;

	while (i < aLen) {
		charCodeCache[start + i] = a.charCodeAt(start + i);
		arr[i] = ++i;
	}

	while (j < bLen) {
		bCharCode = b.charCodeAt(start + j);
		tmp = j++;
		ret = j;

		for (i = 0; i < aLen; i++) {
			tmp2 = bCharCode === charCodeCache[start + i] ? tmp : tmp + 1;
			tmp = arr[i];
			ret = arr[i] = tmp > ret ? tmp2 > ret ? ret + 1 : tmp2 : tmp2 > tmp ? tmp + 1 : tmp2;
		}
	}

	return ret;
};


/***/ }),

/***/ "./node_modules/mri/lib/index.js":
/*!***************************************!*\
  !*** ./node_modules/mri/lib/index.js ***!
  \***************************************/
/***/ ((module) => {

function toArr(any) {
	return any == null ? [] : Array.isArray(any) ? any : [any];
}

function toVal(out, key, val, opts) {
	var x, old=out[key], nxt=(
		!!~opts.string.indexOf(key) ? (val == null || val === true ? '' : String(val))
		: typeof val === 'boolean' ? val
		: !!~opts.boolean.indexOf(key) ? (val === 'false' ? false : val === 'true' || (out._.push((x = +val,x * 0 === 0) ? x : val),!!val))
		: (x = +val,x * 0 === 0) ? x : val
	);
	out[key] = old == null ? nxt : (Array.isArray(old) ? old.concat(nxt) : [old, nxt]);
}

module.exports = function (args, opts) {
	args = args || [];
	opts = opts || {};

	var k, arr, arg, name, val, out={ _:[] };
	var i=0, j=0, idx=0, len=args.length;

	const alibi = opts.alias !== void 0;
	const strict = opts.unknown !== void 0;
	const defaults = opts.default !== void 0;

	opts.alias = opts.alias || {};
	opts.string = toArr(opts.string);
	opts.boolean = toArr(opts.boolean);

	if (alibi) {
		for (k in opts.alias) {
			arr = opts.alias[k] = toArr(opts.alias[k]);
			for (i=0; i < arr.length; i++) {
				(opts.alias[arr[i]] = arr.concat(k)).splice(i, 1);
			}
		}
	}

	opts.boolean.forEach(key => {
		opts.boolean = opts.boolean.concat(opts.alias[key] = opts.alias[key] || []);
	});

	opts.string.forEach(key => {
		opts.string = opts.string.concat(opts.alias[key] = opts.alias[key] || []);
	});

	if (defaults) {
		for (k in opts.default) {
			opts.alias[k] = opts.alias[k] || [];
			(opts[typeof opts.default[k]] || []).push(k);
		}
	}

	const keys = strict ? Object.keys(opts.alias) : [];

	for (i=0; i < len; i++) {
		arg = args[i];

		if (arg === '--') {
			out._ = out._.concat(args.slice(++i));
			break;
		}

		for (j=0; j < arg.length; j++) {
			if (arg.charCodeAt(j) !== 45) break; // "-"
		}

		if (j === 0) {
			out._.push(arg);
		} else if (arg.substring(j, j + 3) === 'no-') {
			name = arg.substring(j + 3);
			if (strict && !~keys.indexOf(name)) {
				return opts.unknown(arg);
			}
			out[name] = false;
		} else {
			for (idx=j+1; idx < arg.length; idx++) {
				if (arg.charCodeAt(idx) === 61) break; // "="
			}

			name = arg.substring(j, idx);
			val = arg.substring(++idx) || (i+1 === len || (''+args[i+1]).charCodeAt(0) === 45 || args[++i]);
			arr = (j === 2 ? [name] : name);

			for (idx=0; idx < arr.length; idx++) {
				name = arr[idx];
				if (strict && !~keys.indexOf(name)) return opts.unknown('-'.repeat(j) + name);
				toVal(out, name, (idx + 1 < arr.length) || val, opts);
			}
		}
	}

	if (defaults) {
		for (k in opts.default) {
			if (out[k] === void 0) {
				out[k] = opts.default[k];
			}
		}
	}

	if (alibi) {
		for (k in out) {
			arr = opts.alias[k] || [];
			while (arr.length > 0) {
				out[arr.shift()] = out[k];
			}
		}
	}

	return out;
}


/***/ }),

/***/ "./node_modules/node-cmd/cmd.js":
/*!**************************************!*\
  !*** ./node_modules/node-cmd/cmd.js ***!
  \**************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

const { exec, execSync } = __webpack_require__(/*! child_process */ "child_process"); 

const commandline={
    run:runCommand,
    runSync:runSync,
};

function runCommand(command,callback){
    
    return exec(
        command,
        (
            function(){
                return function(err,data,stderr){
                    if(!callback)
                        return;

                    callback(err, data, stderr);
                }
            }
        )(callback)
    );
}

function runSync(command){
    try {
        return { 
            data:   execSync(command).toString(), 
            err:    null, 
            stderr: null 
        }
    } 
    catch (error) {
        return { 
            data:   null, 
            err:    error.stderr.toString(), 
            stderr: error.stderr.toString() 
        }
    }
}

module.exports=commandline;


/***/ }),

/***/ "./node_modules/pify/index.js":
/*!************************************!*\
  !*** ./node_modules/pify/index.js ***!
  \************************************/
/***/ ((module) => {

"use strict";


const processFn = (fn, opts) => function () {
	const P = opts.promiseModule;
	const args = new Array(arguments.length);

	for (let i = 0; i < arguments.length; i++) {
		args[i] = arguments[i];
	}

	return new P((resolve, reject) => {
		if (opts.errorFirst) {
			args.push(function (err, result) {
				if (opts.multiArgs) {
					const results = new Array(arguments.length - 1);

					for (let i = 1; i < arguments.length; i++) {
						results[i - 1] = arguments[i];
					}

					if (err) {
						results.unshift(err);
						reject(results);
					} else {
						resolve(results);
					}
				} else if (err) {
					reject(err);
				} else {
					resolve(result);
				}
			});
		} else {
			args.push(function (result) {
				if (opts.multiArgs) {
					const results = new Array(arguments.length - 1);

					for (let i = 0; i < arguments.length; i++) {
						results[i] = arguments[i];
					}

					resolve(results);
				} else {
					resolve(result);
				}
			});
		}

		fn.apply(this, args);
	});
};

module.exports = (obj, opts) => {
	opts = Object.assign({
		exclude: [/.+(Sync|Stream)$/],
		errorFirst: true,
		promiseModule: Promise
	}, opts);

	const filter = key => {
		const match = pattern => typeof pattern === 'string' ? key === pattern : pattern.test(key);
		return opts.include ? opts.include.some(match) : !opts.exclude.some(match);
	};

	let ret;
	if (typeof obj === 'function') {
		ret = function () {
			if (opts.excludeMain) {
				return obj.apply(this, arguments);
			}

			return processFn(obj, opts).apply(this, arguments);
		};
	} else {
		ret = Object.create(Object.getPrototypeOf(obj));
	}

	for (const key in obj) { // eslint-disable-line guard-for-in
		const x = obj[key];
		ret[key] = typeof x === 'function' && filter(key) ? processFn(x, opts) : x;
	}

	return ret;
};


/***/ }),

/***/ "./node_modules/universalify/index.js":
/*!********************************************!*\
  !*** ./node_modules/universalify/index.js ***!
  \********************************************/
/***/ ((__unused_webpack_module, exports) => {

"use strict";


exports.fromCallback = function (fn) {
  return Object.defineProperty(function (...args) {
    if (typeof args[args.length - 1] === 'function') fn.apply(this, args)
    else {
      return new Promise((resolve, reject) => {
        fn.call(
          this,
          ...args,
          (err, res) => (err != null) ? reject(err) : resolve(res)
        )
      })
    }
  }, 'name', { value: fn.name })
}

exports.fromPromise = function (fn) {
  return Object.defineProperty(function (...args) {
    const cb = args[args.length - 1]
    if (typeof cb !== 'function') return fn.apply(this, args)
    else fn.apply(this, args.slice(0, -1)).then(r => cb(null, r), cb)
  }, 'name', { value: fn.name })
}


/***/ }),

/***/ "tslib":
/*!************************!*\
  !*** external "tslib" ***!
  \************************/
/***/ ((module) => {

"use strict";
module.exports = require("tslib");

/***/ }),

/***/ "assert":
/*!*************************!*\
  !*** external "assert" ***!
  \*************************/
/***/ ((module) => {

"use strict";
module.exports = require("assert");

/***/ }),

/***/ "child_process":
/*!********************************!*\
  !*** external "child_process" ***!
  \********************************/
/***/ ((module) => {

"use strict";
module.exports = require("child_process");

/***/ }),

/***/ "constants":
/*!****************************!*\
  !*** external "constants" ***!
  \****************************/
/***/ ((module) => {

"use strict";
module.exports = require("constants");

/***/ }),

/***/ "electron":
/*!***************************!*\
  !*** external "electron" ***!
  \***************************/
/***/ ((module) => {

"use strict";
module.exports = require("electron");

/***/ }),

/***/ "fs":
/*!*********************!*\
  !*** external "fs" ***!
  \*********************/
/***/ ((module) => {

"use strict";
module.exports = require("fs");

/***/ }),

/***/ "os":
/*!*********************!*\
  !*** external "os" ***!
  \*********************/
/***/ ((module) => {

"use strict";
module.exports = require("os");

/***/ }),

/***/ "path":
/*!***********************!*\
  !*** external "path" ***!
  \***********************/
/***/ ((module) => {

"use strict";
module.exports = require("path");

/***/ }),

/***/ "stream":
/*!*************************!*\
  !*** external "stream" ***!
  \*************************/
/***/ ((module) => {

"use strict";
module.exports = require("stream");

/***/ }),

/***/ "util":
/*!***********************!*\
  !*** external "util" ***!
  \***********************/
/***/ ((module) => {

"use strict";
module.exports = require("util");

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			id: moduleId,
/******/ 			loaded: false,
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/node module decorator */
/******/ 	(() => {
/******/ 		__webpack_require__.nmd = (module) => {
/******/ 			module.paths = [];
/******/ 			if (!module.children) module.children = [];
/******/ 			return module;
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be in strict mode.
(() => {
"use strict";
var exports = __webpack_exports__;
/*!******************************!*\
  !*** ./src/command/index.ts ***!
  \******************************/

Object.defineProperty(exports, "__esModule", ({ value: true }));
const tslib_1 = __webpack_require__(/*! tslib */ "tslib");
// This is a CLI tool, using console is OK
/* eslint no-console: 0 */
const child_process_1 = __webpack_require__(/*! child_process */ "child_process");
const { app } = __webpack_require__(/*! electron */ "electron");
const pify_1 = tslib_1.__importDefault(__webpack_require__(/*! pify */ "./node_modules/pify/index.js"));
const args_1 = tslib_1.__importDefault(__webpack_require__(/*! args */ "./node_modules/args/lib/index.js"));
const path_1 = tslib_1.__importDefault(__webpack_require__(/*! path */ "path"));
const fs_extra_1 = tslib_1.__importDefault(__webpack_require__(/*! fs-extra */ "./node_modules/fs-extra/lib/index.js"));
const node_cmd_1 = tslib_1.__importDefault(__webpack_require__(/*! node-cmd */ "./node_modules/node-cmd/cmd.js"));
const appName = app.getName();
// args.command(
//   'dental',
//   'Open the dental website',
//   (name:string, args_:any) => {
//     void open(`https://www.dental3dcloud.com/p/index`, {wait: false});
//     process.exit(0);
//   },
//   ['d']
// );
// args.command(
//   'page',
//   'go to target page',
//   (name, args_) => {
// 		if (process.platform === 'darwin') {
// 			const apppath = `/Applications/${appName}.app`;
// 			console.log('args_join == ',args_.join(' '))
// 			const cmd = `open -b co.shining.appbox --args ${args_.join(' ')}`;
// 			console.log('cmd = ',cmd)
// 			exec(cmd);
// 			process.exit(0);
// 		}else{
// 			const child = spawn(process.execPath, args_);
// 			child.unref();
// 		}
//   },
//   ['p','h']
// );
args_1.default.command('<default>', `Launch ${appName}`);
args_1.default.option(['v', 'verbose'], 'Verbose mode', false);
args_1.default.command('version', `Show the version of ${appName}`, () => {
    const packageJson = fs_extra_1.default.readJSONSync(path_1.default.join(__dirname, '../../package.json'));
    console.log('主项目名称 == ', packageJson.version);
    console.log(1.0);
    process.exit(0);
}, []);
args_1.default.command('open', 'Open related software', (name, args_) => {
    if (process.platform === 'darwin') {
        const apppath = '/Applications/DingTalk.app';
        console.log('args_join == ', args_.join(' '));
        const script = `open ${apppath}`;
        node_cmd_1.default.runSync(script);
    }
    else {
        console.log(`name=${name} args=${args_}`);
    }
    process.exit(0);
});
const main = (argv) => {
    const flags = args_1.default.parse(argv, {
        name: appName,
        version: false,
        mri: {
            boolean: ['v', 'verbose']
        }
    });
    const env = Object.assign({}, process.env, {
        // this will signal ${appName} that it was spawned from this module
        SHININGAPP_CLI: '1',
        ELECTRON_NO_ATTACH_CONSOLE: '1'
    });
    delete env['ELECTRON_RUN_AS_NODE'];
    if (flags.verbose) {
        env['ELECTRON_ENABLE_LOGGING'] = '1';
    }
    const options = {
        detached: true,
        env
    };
    const args_ = args_1.default.sub.map((arg) => {
        // const cwd = isAbsolute(arg) ? arg : resolve(process.cwd(), arg);
        // if (!existsSync(cwd)) {
        //   console.error(`Error! Directory or file does not exist: ${cwd}`);
        //   process.exit(1);
        // }
        return arg;
    });
    if (!flags.verbose) {
        options['stdio'] = 'ignore';
        if (process.platform === 'darwin') {
            //Use `open` to prevent multiple ${appName} process
            const cmd = `open -b co.shining.appbox --args ${args_1.default.sub.join(' ')}`;
            console.log('args == ', args_1.default.sub);
            const opts = {
                env
            };
            // return exec(cmd, opts);
            return (0, pify_1.default)(child_process_1.exec)(cmd, opts);
        }
    }
    const child = (0, child_process_1.spawn)(process.execPath, args_1.default.sub, options);
    if (flags.verbose) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        child.stdout?.on('data', (data) => console.log(data.toString('utf8')));
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        child.stderr?.on('data', (data) => console.error(data.toString('utf8')));
    }
    if (flags.verbose) {
        return new Promise((c) => child.once('exit', () => c(null)));
    }
    child.unref();
    return Promise.resolve();
};
function eventuallyExit(code) {
    setTimeout(() => process.exit(code), 100);
}
main(process.argv)
    .then(() => eventuallyExit(0))
    .catch((err) => {
    console.error(err.stack ? err.stack : err);
    eventuallyExit(1);
});

})();

module.exports = __webpack_exports__;
/******/ })()
;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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QUFDQTtBQUNBOztBQUVBOztBQUVBO0FBQ0E7QUFDQSxHQUFHO0FBQ0g7QUFDQSxHQUFHO0FBQ0g7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQSxHQUFHO0FBQ0g7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBLElBQUk7QUFDSjtBQUNBLElBQUk7QUFDSjtBQUNBO0FBQ0E7QUFDQTtBQUNBLElBQUk7QUFDSjtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0EsR0FBRztBQUNIO0FBQ0E7O0FBRUE7O0FBRUE7QUFDQSxpQkFBaUIsT0FBTztBQUN4QjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0EsSUFBSTtBQUNKO0FBQ0EsSUFBSTtBQUNKO0FBQ0EsSUFBSTtBQUNKO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUEsd0JBQXdCOztBQUV4QjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxpQkFBaUIsT0FBTyxRQUFRO0FBQ2hDLGlCQUFpQixPQUFPLFFBQVE7QUFDaEMsa0JBQWtCLE9BQU8sT0FBTztBQUNoQyxrQkFBa0IsT0FBTyxPQUFPO0FBQ2hDLGlCQUFpQixRQUFRLE9BQU87QUFDaEMsaUJBQWlCLFFBQVEsT0FBTztBQUNoQzs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQSx1RUFBdUU7O0FBRXZFOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBLHVCQUF1QjtBQUN2QjtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQSwrQ0FBK0MsRUFBRSxVQUFVLEVBQUU7QUFDN0Q7QUFDQTtBQUNBOztBQUVBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLEdBQUc7QUFDSDs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0EsR0FBRztBQUNIO0FBQ0E7O0FBRUE7QUFDQTtBQUNBLEdBQUc7QUFDSDtBQUNBO0FBQ0EsR0FBRztBQUNIO0FBQ0E7QUFDQSxHQUFHO0FBQ0g7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0EsR0FBRztBQUNIO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBLGdCQUFnQixhQUFhLGFBQWE7QUFDMUM7QUFDQSxnQkFBZ0IsYUFBYSxhQUFhO0FBQzFDO0FBQ0EsZ0JBQWdCLGFBQWEsYUFBYTtBQUMxQztBQUNBLGdCQUFnQixhQUFhLGFBQWE7QUFDMUM7QUFDQSxnQkFBZ0IsYUFBYSxhQUFhO0FBQzFDO0FBQ0EsZ0JBQWdCLGFBQWE7QUFDN0I7O0FBRUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQSxHQUFHO0FBQ0g7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7Ozs7Ozs7QUNuMkJBLGtCQUFrQixtQkFBTyxDQUFDLGtFQUFlO0FBQ3pDLFlBQVksbUJBQU8sQ0FBQyxzREFBUzs7QUFFN0I7O0FBRUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBOztBQUVBO0FBQ0EsbUNBQW1DO0FBQ25DO0FBQ0E7QUFDQSx3Q0FBd0MsU0FBUztBQUNqRDtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUEsd0RBQXdELHVDQUF1QztBQUMvRixzREFBc0QscUNBQXFDOztBQUUzRjtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBLEVBQUU7QUFDRixDQUFDOztBQUVEOzs7Ozs7Ozs7OztBQzdFQSxrQkFBa0IsbUJBQU8sQ0FBQyxrRUFBZTs7QUFFekM7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBLHNDQUFzQyxTQUFTO0FBQy9DO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsMEJBQTBCOztBQUUxQjs7QUFFQTtBQUNBO0FBQ0E7O0FBRUEsMENBQTBDLFNBQVM7QUFDbkQ7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0Esc0NBQXNDLFNBQVM7QUFDL0M7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7Ozs7Ozs7Ozs7Ozs7QUMvRlk7QUFDWjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7Ozs7Ozs7O0FDdkphOztBQUViLDhCQUE4Qjs7QUFFOUI7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QUFDQTtBQUNBO0FBQ0EsTUFBTSxpREFBdUI7QUFDN0IsS0FBSztBQUNMO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLE9BQU87QUFDUDtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLE9BQU87QUFDUDtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsT0FBTztBQUNQO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxPQUFPO0FBQ1A7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBLEdBQUc7QUFDSDtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0EsR0FBRzs7QUFFSDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBLEdBQUc7QUFDSDtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQSxHQUFHOztBQUVIO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQSxRQUFRO0FBQ1I7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFFBQVE7QUFDUjtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxPQUFPO0FBQ1A7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esa0JBQWtCLDhCQUE4QjtBQUNoRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxJQUFJO0FBQ0o7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLElBQUk7QUFDSjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxNQUFNO0FBQ047QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7Ozs7OztBQy9iQSxhQUFhLG9EQUF3Qjs7QUFFckM7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBOztBQUVBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0EscUJBQXFCO0FBQ3JCOztBQUVBOztBQUVBO0FBQ0E7QUFDQSw4Q0FBOEMsZ0JBQWdCO0FBQzlEO0FBQ0E7QUFDQTs7QUFFQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxRQUFRO0FBQ1I7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxPQUFPO0FBQ1A7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMOztBQUVBO0FBQ0E7O0FBRUE7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQSxxQkFBcUI7QUFDckI7O0FBRUE7O0FBRUE7QUFDQTtBQUNBLDhDQUE4QyxnQkFBZ0I7QUFDOUQ7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7Ozs7Ozs7QUNySEEsZ0JBQWdCLG1CQUFPLENBQUMsNEJBQVc7O0FBRW5DO0FBQ0E7O0FBRUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxFQUFFOztBQUVGO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsZUFBZTtBQUNmLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLEdBQUc7O0FBRUg7QUFDQSw4QkFBOEI7QUFDOUI7QUFDQTtBQUNBO0FBQ0E7QUFDQSxRQUFRO0FBQ1I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxJQUFJOztBQUVKO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFdBQVc7QUFDWCxTQUFTO0FBQ1QsT0FBTztBQUNQOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxRQUFRO0FBQ1I7QUFDQTtBQUNBO0FBQ0EsWUFBWTtBQUNaLFVBQVU7QUFDVjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYixXQUFXO0FBQ1gsU0FBUztBQUNUOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsVUFBVTtBQUNWO0FBQ0E7QUFDQTtBQUNBLGNBQWM7QUFDZCxZQUFZO0FBQ1o7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQSxNQUFNO0FBQ04sK0NBQStDO0FBQy9DO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxPQUFPO0FBQ1A7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsUUFBUTtBQUNSO0FBQ0E7QUFDQTtBQUNBOzs7QUFHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxPQUFPO0FBQ1A7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsUUFBUTtBQUNSO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7Ozs7Ozs7Ozs7QUNsV0E7QUFDQTtBQUNBLFFBQVEsbUJBQU8sQ0FBQyw4REFBYTtBQUM3QixFQUFFO0FBQ0YsUUFBUSxtQkFBTyxDQUFDLGNBQUk7QUFDcEI7QUFDQSxxQkFBcUIsbUJBQU8sQ0FBQywwREFBYztBQUMzQyxRQUFRLHNCQUFzQixFQUFFLG1CQUFPLENBQUMsaURBQVM7O0FBRWpELDRDQUE0QztBQUM1QztBQUNBLGdCQUFnQjtBQUNoQjs7QUFFQTs7QUFFQTs7QUFFQTs7QUFFQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxJQUFJO0FBQ0o7QUFDQSx1QkFBdUIsS0FBSyxJQUFJLFlBQVk7QUFDNUM7QUFDQSxNQUFNO0FBQ047QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7O0FBRUEseUNBQXlDO0FBQ3pDO0FBQ0EsZ0JBQWdCO0FBQ2hCOztBQUVBOztBQUVBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsSUFBSTtBQUNKO0FBQ0EsdUJBQXVCLEtBQUssSUFBSSxZQUFZO0FBQzVDO0FBQ0EsTUFBTTtBQUNOO0FBQ0E7QUFDQTtBQUNBOztBQUVBLGtEQUFrRDtBQUNsRDs7QUFFQTs7QUFFQTtBQUNBOztBQUVBOztBQUVBLCtDQUErQztBQUMvQzs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7Ozs7Ozs7Ozs7O0FDdkZBLDJCQUEyQix1REFBdUQsSUFBSTtBQUN0RjtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQSxtQkFBbUI7Ozs7Ozs7Ozs7OztBQ2JuQjtBQUNhO0FBQ2I7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUEsY0FBYyxVQUFVO0FBQ3hCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7Ozs7Ozs7Ozs7QUNwRkE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUEsbUNBQW1DO0FBQ25DOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsYUFBYSxnQkFBZ0I7QUFDN0I7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBLEVBQUU7O0FBRUY7QUFDQTtBQUNBLEVBQUU7O0FBRUY7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBOztBQUVBLFdBQVcsU0FBUztBQUNwQjs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQSxZQUFZLGdCQUFnQjtBQUM1Qix3Q0FBd0M7QUFDeEM7O0FBRUE7QUFDQTtBQUNBLElBQUk7QUFDSjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsSUFBSTtBQUNKLGlCQUFpQixrQkFBa0I7QUFDbkMsMkNBQTJDO0FBQzNDOztBQUVBO0FBQ0E7QUFDQTs7QUFFQSxlQUFlLGtCQUFrQjtBQUNqQztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOzs7Ozs7Ozs7OztBQzlHQSxRQUFRLGlCQUFpQixFQUFFLG1CQUFPLENBQUMsb0NBQWU7QUFDbEQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7Ozs7Ozs7O0FDekNhOztBQUViO0FBQ0E7QUFDQTs7QUFFQSxpQkFBaUIsc0JBQXNCO0FBQ3ZDO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQSxxQkFBcUIsc0JBQXNCO0FBQzNDO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsT0FBTztBQUNQO0FBQ0E7QUFDQSxNQUFNO0FBQ047QUFDQSxNQUFNO0FBQ047QUFDQTtBQUNBLElBQUk7QUFDSixJQUFJO0FBQ0o7QUFDQTtBQUNBOztBQUVBLHFCQUFxQixzQkFBc0I7QUFDM0M7QUFDQTs7QUFFQTtBQUNBLE1BQU07QUFDTjtBQUNBO0FBQ0EsSUFBSTtBQUNKOztBQUVBO0FBQ0EsRUFBRTtBQUNGOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxFQUFFOztBQUVGO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0EsR0FBRztBQUNIO0FBQ0E7O0FBRUEsMEJBQTBCO0FBQzFCO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOzs7Ozs7Ozs7Ozs7QUNuRlk7O0FBRVosb0JBQW9CO0FBQ3BCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLE9BQU87QUFDUDtBQUNBLEdBQUcsWUFBWSxnQkFBZ0I7QUFDL0I7O0FBRUEsbUJBQW1CO0FBQ25CO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsR0FBRyxZQUFZLGdCQUFnQjtBQUMvQjs7Ozs7Ozs7Ozs7O0FDdkJBOzs7Ozs7Ozs7OztBQ0FBOzs7Ozs7Ozs7OztBQ0FBOzs7Ozs7Ozs7OztBQ0FBOzs7Ozs7Ozs7OztBQ0FBOzs7Ozs7Ozs7OztBQ0FBOzs7Ozs7Ozs7OztBQ0FBOzs7Ozs7Ozs7OztBQ0FBOzs7Ozs7Ozs7OztBQ0FBOzs7Ozs7Ozs7OztBQ0FBOzs7Ozs7VUNBQTtVQUNBOztVQUVBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBOztVQUVBO1VBQ0E7O1VBRUE7VUFDQTs7VUFFQTtVQUNBO1VBQ0E7Ozs7O1dDekJBOzs7OztXQ0FBO1dBQ0E7V0FDQTtXQUNBO1dBQ0E7Ozs7Ozs7Ozs7Ozs7OztBQ0pBLDBDQUEwQztBQUMxQywwQkFBMEI7QUFDMUIsa0ZBQTBDO0FBQzFDLE1BQU0sRUFBRSxHQUFHLEVBQUUsR0FBRyxtQkFBTyxDQUFDLDBCQUFVLENBQUMsQ0FBQztBQUNwQyx3R0FBd0I7QUFDeEIsNEdBQXdCO0FBQ3hCLGdGQUF3QjtBQUN4Qix3SEFBNEI7QUFDNUIsa0hBQTJCO0FBRzNCLE1BQU0sT0FBTyxHQUFHLEdBQUcsQ0FBQyxPQUFPLEVBQUUsQ0FBQztBQUM5QixnQkFBZ0I7QUFDaEIsY0FBYztBQUNkLCtCQUErQjtBQUMvQixrQ0FBa0M7QUFDbEMseUVBQXlFO0FBQ3pFLHVCQUF1QjtBQUN2QixPQUFPO0FBQ1AsVUFBVTtBQUNWLEtBQUs7QUFHTCxnQkFBZ0I7QUFDaEIsWUFBWTtBQUNaLHlCQUF5QjtBQUN6Qix1QkFBdUI7QUFDdkIseUNBQXlDO0FBQ3pDLHFEQUFxRDtBQUNyRCxrREFBa0Q7QUFDbEQsd0VBQXdFO0FBQ3hFLCtCQUErQjtBQUMvQixnQkFBZ0I7QUFDaEIsc0JBQXNCO0FBQ3RCLFdBQVc7QUFDWCxtREFBbUQ7QUFDbkQsb0JBQW9CO0FBQ3BCLE1BQU07QUFFTixPQUFPO0FBQ1AsY0FBYztBQUNkLEtBQUs7QUFJTCxjQUFJLENBQUMsT0FBTyxDQUFDLFdBQVcsRUFBRSxVQUFVLE9BQU8sRUFBRSxDQUFDLENBQUM7QUFFL0MsY0FBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLEdBQUcsRUFBRSxTQUFTLENBQUMsRUFBRSxjQUFjLEVBQUUsS0FBSyxDQUFDLENBQUM7QUFFckQsY0FBSSxDQUFDLE9BQU8sQ0FDVixTQUFTLEVBQ1QsdUJBQXVCLE9BQU8sRUFBRSxFQUNoQyxHQUFHLEVBQUU7SUFDSCxNQUFNLFdBQVcsR0FBRyxrQkFBRSxDQUFDLFlBQVksQ0FBQyxjQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxvQkFBb0IsQ0FBQyxDQUFDLENBQUM7SUFDaEYsT0FBTyxDQUFDLEdBQUcsQ0FBQyxXQUFXLEVBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBQzdDLE9BQU8sQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUM7SUFDakIsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNsQixDQUFDLEVBQ0QsRUFBRSxDQUNILENBQUM7QUFFRixjQUFJLENBQUMsT0FBTyxDQUNWLE1BQU0sRUFDTix1QkFBdUIsRUFDdkIsQ0FBQyxJQUFXLEVBQUUsS0FBUyxFQUFDLEVBQUU7SUFDeEIsSUFBSSxPQUFPLENBQUMsUUFBUSxLQUFLLFFBQVEsRUFBRTtRQUNwQyxNQUFNLE9BQU8sR0FBRyw0QkFBNEIsQ0FBQztRQUM3QyxPQUFPLENBQUMsR0FBRyxDQUFDLGVBQWUsRUFBQyxLQUFLLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQzVDLE1BQU0sTUFBTSxHQUFHLFFBQVEsT0FBTyxFQUFFLENBQUM7UUFDOUIsa0JBQUcsQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUM7S0FDdkI7U0FBSTtRQUNKLE9BQU8sQ0FBQyxHQUFHLENBQUMsUUFBUSxJQUFJLFNBQVMsS0FBSyxFQUFFLENBQUMsQ0FBQztLQUMxQztJQUNDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDbEIsQ0FBQyxDQUNGLENBQUM7QUFHRixNQUFNLElBQUksR0FBRyxDQUFDLElBQVEsRUFBRSxFQUFFO0lBQ3hCLE1BQU0sS0FBSyxHQUFHLGNBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFO1FBQzdCLElBQUksRUFBRSxPQUFPO1FBQ2IsT0FBTyxFQUFFLEtBQUs7UUFDZCxHQUFHLEVBQUU7WUFDSCxPQUFPLEVBQUUsQ0FBQyxHQUFHLEVBQUUsU0FBUyxDQUFDO1NBQzFCO0tBQ0YsQ0FBQyxDQUFDO0lBRUgsTUFBTSxHQUFHLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQyxFQUFFLEVBQUUsT0FBTyxDQUFDLEdBQUcsRUFBRTtRQUN6QyxtRUFBbUU7UUFDbkUsY0FBYyxFQUFFLEdBQUc7UUFDbkIsMEJBQTBCLEVBQUUsR0FBRztLQUNoQyxDQUFDLENBQUM7SUFFSCxPQUFPLEdBQUcsQ0FBQyxzQkFBc0IsQ0FBQyxDQUFDO0lBRW5DLElBQUksS0FBSyxDQUFDLE9BQU8sRUFBRTtRQUNqQixHQUFHLENBQUMseUJBQXlCLENBQUMsR0FBRyxHQUFHLENBQUM7S0FDdEM7SUFFRCxNQUFNLE9BQU8sR0FBRztRQUNkLFFBQVEsRUFBRSxJQUFJO1FBQ2QsR0FBRztLQUNKLENBQUM7SUFFRixNQUFNLEtBQUssR0FBRyxjQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQU8sRUFBRSxFQUFFO1FBQ3JDLG1FQUFtRTtRQUNuRSwwQkFBMEI7UUFDMUIsc0VBQXNFO1FBQ3RFLHFCQUFxQjtRQUNyQixJQUFJO1FBQ0osT0FBTyxHQUFHLENBQUM7SUFDYixDQUFDLENBQUMsQ0FBQztJQUVILElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxFQUFFO1FBQ2xCLE9BQU8sQ0FBQyxPQUFPLENBQUMsR0FBRyxRQUFRLENBQUM7UUFDNUIsSUFBSSxPQUFPLENBQUMsUUFBUSxLQUFLLFFBQVEsRUFBRTtZQUNqQyxtREFBbUQ7WUFDbkQsTUFBTSxHQUFHLEdBQUcsb0NBQW9DLGNBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUM7WUFDeEUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxVQUFVLEVBQUMsY0FBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQzlCLE1BQU0sSUFBSSxHQUFHO2dCQUNYLEdBQUc7YUFDSixDQUFDO1lBQ0YsMEJBQTBCO1lBQ3hCLE9BQU8sa0JBQUksRUFBQyxvQkFBSSxDQUFDLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQyxDQUFDO1NBQ2hDO0tBQ0Y7SUFFRCxNQUFNLEtBQUssR0FBRyx5QkFBSyxFQUFDLE9BQU8sQ0FBQyxRQUFRLEVBQUUsY0FBSSxDQUFDLEdBQUcsRUFBRSxPQUFPLENBQUMsQ0FBQztJQUV6RCxJQUFJLEtBQUssQ0FBQyxPQUFPLEVBQUU7UUFDakIsNkRBQTZEO1FBQzdELEtBQUssQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDLE1BQU0sRUFBRSxDQUFDLElBQVEsRUFBRSxFQUFFLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUMzRSw2REFBNkQ7UUFDN0QsS0FBSyxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUMsTUFBTSxFQUFFLENBQUMsSUFBUSxFQUFFLEVBQUUsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDO0tBQzlFO0lBQ0QsSUFBSSxLQUFLLENBQUMsT0FBTyxFQUFFO1FBQ2pCLE9BQU8sSUFBSSxPQUFPLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7S0FDOUQ7SUFDRCxLQUFLLENBQUMsS0FBSyxFQUFFLENBQUM7SUFDZCxPQUFPLE9BQU8sQ0FBQyxPQUFPLEVBQUUsQ0FBQztBQUMzQixDQUFDLENBQUM7QUFFRixTQUFTLGNBQWMsQ0FBQyxJQUFXO0lBQ2pDLFVBQVUsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDO0FBQzVDLENBQUM7QUFFRCxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQztLQUNmLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDLENBQUM7S0FDN0IsS0FBSyxDQUFDLENBQUMsR0FBTyxFQUFFLEVBQUU7SUFDakIsT0FBTyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUMzQyxjQUFjLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDdEIsQ0FBQyxDQUFDLENBQUMiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9kb2N0b3JkZXNrLy4vbm9kZV9tb2R1bGVzL2FyZ3MvbGliL2NvbW1hbmQuanMiLCJ3ZWJwYWNrOi8vZG9jdG9yZGVzay8uL25vZGVfbW9kdWxlcy9hcmdzL2xpYi9leGFtcGxlLmpzIiwid2VicGFjazovL2RvY3RvcmRlc2svLi9ub2RlX21vZHVsZXMvYXJncy9saWIvZXhhbXBsZXMuanMiLCJ3ZWJwYWNrOi8vZG9jdG9yZGVzay8uL25vZGVfbW9kdWxlcy9hcmdzL2xpYi9oZWxwLmpzIiwid2VicGFjazovL2RvY3RvcmRlc2svLi9ub2RlX21vZHVsZXMvYXJncy9saWIvaW5kZXguanMiLCJ3ZWJwYWNrOi8vZG9jdG9yZGVzay8uL25vZGVfbW9kdWxlcy9hcmdzL2xpYi9vcHRpb24uanMiLCJ3ZWJwYWNrOi8vZG9jdG9yZGVzay8uL25vZGVfbW9kdWxlcy9hcmdzL2xpYi9vcHRpb25zLmpzIiwid2VicGFjazovL2RvY3RvcmRlc2svLi9ub2RlX21vZHVsZXMvYXJncy9saWIvcGFyc2UuanMiLCJ3ZWJwYWNrOi8vZG9jdG9yZGVzay8uL25vZGVfbW9kdWxlcy9hcmdzL2xpYi91dGlscy5qcyIsIndlYnBhY2s6Ly9kb2N0b3JkZXNrLy4vbm9kZV9tb2R1bGVzL2FyZ3MvbGliL3ZlcnNpb24uanMiLCJ3ZWJwYWNrOi8vZG9jdG9yZGVzay8uL25vZGVfbW9kdWxlcy9hcmdzL2xpYi8gc3luYyIsIndlYnBhY2s6Ly9kb2N0b3JkZXNrLy4vbm9kZV9tb2R1bGVzL2FyZ3Mvbm9kZV9tb2R1bGVzL2Fuc2ktc3R5bGVzL2luZGV4LmpzIiwid2VicGFjazovL2RvY3RvcmRlc2svLi9ub2RlX21vZHVsZXMvYXJncy9ub2RlX21vZHVsZXMvY2hhbGsvaW5kZXguanMiLCJ3ZWJwYWNrOi8vZG9jdG9yZGVzay8uL25vZGVfbW9kdWxlcy9hcmdzL25vZGVfbW9kdWxlcy9jaGFsay90ZW1wbGF0ZXMuanMiLCJ3ZWJwYWNrOi8vZG9jdG9yZGVzay8uL25vZGVfbW9kdWxlcy9hcmdzL25vZGVfbW9kdWxlcy9oYXMtZmxhZy9pbmRleC5qcyIsIndlYnBhY2s6Ly9kb2N0b3JkZXNrLy4vbm9kZV9tb2R1bGVzL2FyZ3Mvbm9kZV9tb2R1bGVzL3N1cHBvcnRzLWNvbG9yL2luZGV4LmpzIiwid2VicGFjazovL2RvY3RvcmRlc2svLi9ub2RlX21vZHVsZXMvY2FtZWxjYXNlL2luZGV4LmpzIiwid2VicGFjazovL2RvY3RvcmRlc2svLi9ub2RlX21vZHVsZXMvY29sb3ItY29udmVydC9jb252ZXJzaW9ucy5qcyIsIndlYnBhY2s6Ly9kb2N0b3JkZXNrLy4vbm9kZV9tb2R1bGVzL2NvbG9yLWNvbnZlcnQvaW5kZXguanMiLCJ3ZWJwYWNrOi8vZG9jdG9yZGVzay8uL25vZGVfbW9kdWxlcy9jb2xvci1jb252ZXJ0L3JvdXRlLmpzIiwid2VicGFjazovL2RvY3RvcmRlc2svLi9ub2RlX21vZHVsZXMvY29sb3ItbmFtZS9pbmRleC5qcyIsIndlYnBhY2s6Ly9kb2N0b3JkZXNrLy4vbm9kZV9tb2R1bGVzL2VzY2FwZS1zdHJpbmctcmVnZXhwL2luZGV4LmpzIiwid2VicGFjazovL2RvY3RvcmRlc2svLi9ub2RlX21vZHVsZXMvZnMtZXh0cmEvbGliL2NvcHkvY29weS1zeW5jLmpzIiwid2VicGFjazovL2RvY3RvcmRlc2svLi9ub2RlX21vZHVsZXMvZnMtZXh0cmEvbGliL2NvcHkvY29weS5qcyIsIndlYnBhY2s6Ly9kb2N0b3JkZXNrLy4vbm9kZV9tb2R1bGVzL2ZzLWV4dHJhL2xpYi9jb3B5L2luZGV4LmpzIiwid2VicGFjazovL2RvY3RvcmRlc2svLi9ub2RlX21vZHVsZXMvZnMtZXh0cmEvbGliL2VtcHR5L2luZGV4LmpzIiwid2VicGFjazovL2RvY3RvcmRlc2svLi9ub2RlX21vZHVsZXMvZnMtZXh0cmEvbGliL2Vuc3VyZS9maWxlLmpzIiwid2VicGFjazovL2RvY3RvcmRlc2svLi9ub2RlX21vZHVsZXMvZnMtZXh0cmEvbGliL2Vuc3VyZS9pbmRleC5qcyIsIndlYnBhY2s6Ly9kb2N0b3JkZXNrLy4vbm9kZV9tb2R1bGVzL2ZzLWV4dHJhL2xpYi9lbnN1cmUvbGluay5qcyIsIndlYnBhY2s6Ly9kb2N0b3JkZXNrLy4vbm9kZV9tb2R1bGVzL2ZzLWV4dHJhL2xpYi9lbnN1cmUvc3ltbGluay1wYXRocy5qcyIsIndlYnBhY2s6Ly9kb2N0b3JkZXNrLy4vbm9kZV9tb2R1bGVzL2ZzLWV4dHJhL2xpYi9lbnN1cmUvc3ltbGluay10eXBlLmpzIiwid2VicGFjazovL2RvY3RvcmRlc2svLi9ub2RlX21vZHVsZXMvZnMtZXh0cmEvbGliL2Vuc3VyZS9zeW1saW5rLmpzIiwid2VicGFjazovL2RvY3RvcmRlc2svLi9ub2RlX21vZHVsZXMvZnMtZXh0cmEvbGliL2ZzL2luZGV4LmpzIiwid2VicGFjazovL2RvY3RvcmRlc2svLi9ub2RlX21vZHVsZXMvZnMtZXh0cmEvbGliL2luZGV4LmpzIiwid2VicGFjazovL2RvY3RvcmRlc2svLi9ub2RlX21vZHVsZXMvZnMtZXh0cmEvbGliL2pzb24vaW5kZXguanMiLCJ3ZWJwYWNrOi8vZG9jdG9yZGVzay8uL25vZGVfbW9kdWxlcy9mcy1leHRyYS9saWIvanNvbi9qc29uZmlsZS5qcyIsIndlYnBhY2s6Ly9kb2N0b3JkZXNrLy4vbm9kZV9tb2R1bGVzL2ZzLWV4dHJhL2xpYi9qc29uL291dHB1dC1qc29uLXN5bmMuanMiLCJ3ZWJwYWNrOi8vZG9jdG9yZGVzay8uL25vZGVfbW9kdWxlcy9mcy1leHRyYS9saWIvanNvbi9vdXRwdXQtanNvbi5qcyIsIndlYnBhY2s6Ly9kb2N0b3JkZXNrLy4vbm9kZV9tb2R1bGVzL2ZzLWV4dHJhL2xpYi9ta2RpcnMvaW5kZXguanMiLCJ3ZWJwYWNrOi8vZG9jdG9yZGVzay8uL25vZGVfbW9kdWxlcy9mcy1leHRyYS9saWIvbWtkaXJzL21ha2UtZGlyLmpzIiwid2VicGFjazovL2RvY3RvcmRlc2svLi9ub2RlX21vZHVsZXMvZnMtZXh0cmEvbGliL21rZGlycy91dGlscy5qcyIsIndlYnBhY2s6Ly9kb2N0b3JkZXNrLy4vbm9kZV9tb2R1bGVzL2ZzLWV4dHJhL2xpYi9tb3ZlL2luZGV4LmpzIiwid2VicGFjazovL2RvY3RvcmRlc2svLi9ub2RlX21vZHVsZXMvZnMtZXh0cmEvbGliL21vdmUvbW92ZS1zeW5jLmpzIiwid2VicGFjazovL2RvY3RvcmRlc2svLi9ub2RlX21vZHVsZXMvZnMtZXh0cmEvbGliL21vdmUvbW92ZS5qcyIsIndlYnBhY2s6Ly9kb2N0b3JkZXNrLy4vbm9kZV9tb2R1bGVzL2ZzLWV4dHJhL2xpYi9vdXRwdXQtZmlsZS9pbmRleC5qcyIsIndlYnBhY2s6Ly9kb2N0b3JkZXNrLy4vbm9kZV9tb2R1bGVzL2ZzLWV4dHJhL2xpYi9wYXRoLWV4aXN0cy9pbmRleC5qcyIsIndlYnBhY2s6Ly9kb2N0b3JkZXNrLy4vbm9kZV9tb2R1bGVzL2ZzLWV4dHJhL2xpYi9yZW1vdmUvaW5kZXguanMiLCJ3ZWJwYWNrOi8vZG9jdG9yZGVzay8uL25vZGVfbW9kdWxlcy9mcy1leHRyYS9saWIvcmVtb3ZlL3JpbXJhZi5qcyIsIndlYnBhY2s6Ly9kb2N0b3JkZXNrLy4vbm9kZV9tb2R1bGVzL2ZzLWV4dHJhL2xpYi91dGlsL3N0YXQuanMiLCJ3ZWJwYWNrOi8vZG9jdG9yZGVzay8uL25vZGVfbW9kdWxlcy9mcy1leHRyYS9saWIvdXRpbC91dGltZXMuanMiLCJ3ZWJwYWNrOi8vZG9jdG9yZGVzay8uL25vZGVfbW9kdWxlcy9ncmFjZWZ1bC1mcy9jbG9uZS5qcyIsIndlYnBhY2s6Ly9kb2N0b3JkZXNrLy4vbm9kZV9tb2R1bGVzL2dyYWNlZnVsLWZzL2dyYWNlZnVsLWZzLmpzIiwid2VicGFjazovL2RvY3RvcmRlc2svLi9ub2RlX21vZHVsZXMvZ3JhY2VmdWwtZnMvbGVnYWN5LXN0cmVhbXMuanMiLCJ3ZWJwYWNrOi8vZG9jdG9yZGVzay8uL25vZGVfbW9kdWxlcy9ncmFjZWZ1bC1mcy9wb2x5ZmlsbHMuanMiLCJ3ZWJwYWNrOi8vZG9jdG9yZGVzay8uL25vZGVfbW9kdWxlcy9qc29uZmlsZS9pbmRleC5qcyIsIndlYnBhY2s6Ly9kb2N0b3JkZXNrLy4vbm9kZV9tb2R1bGVzL2pzb25maWxlL3V0aWxzLmpzIiwid2VicGFjazovL2RvY3RvcmRlc2svLi9ub2RlX21vZHVsZXMvbGV2ZW4vaW5kZXguanMiLCJ3ZWJwYWNrOi8vZG9jdG9yZGVzay8uL25vZGVfbW9kdWxlcy9tcmkvbGliL2luZGV4LmpzIiwid2VicGFjazovL2RvY3RvcmRlc2svLi9ub2RlX21vZHVsZXMvbm9kZS1jbWQvY21kLmpzIiwid2VicGFjazovL2RvY3RvcmRlc2svLi9ub2RlX21vZHVsZXMvcGlmeS9pbmRleC5qcyIsIndlYnBhY2s6Ly9kb2N0b3JkZXNrLy4vbm9kZV9tb2R1bGVzL3VuaXZlcnNhbGlmeS9pbmRleC5qcyIsIndlYnBhY2s6Ly9kb2N0b3JkZXNrL2V4dGVybmFsIGNvbW1vbmpzMiBcInRzbGliXCIiLCJ3ZWJwYWNrOi8vZG9jdG9yZGVzay9leHRlcm5hbCBub2RlLWNvbW1vbmpzIFwiYXNzZXJ0XCIiLCJ3ZWJwYWNrOi8vZG9jdG9yZGVzay9leHRlcm5hbCBub2RlLWNvbW1vbmpzIFwiY2hpbGRfcHJvY2Vzc1wiIiwid2VicGFjazovL2RvY3RvcmRlc2svZXh0ZXJuYWwgbm9kZS1jb21tb25qcyBcImNvbnN0YW50c1wiIiwid2VicGFjazovL2RvY3RvcmRlc2svZXh0ZXJuYWwgbm9kZS1jb21tb25qcyBcImVsZWN0cm9uXCIiLCJ3ZWJwYWNrOi8vZG9jdG9yZGVzay9leHRlcm5hbCBub2RlLWNvbW1vbmpzIFwiZnNcIiIsIndlYnBhY2s6Ly9kb2N0b3JkZXNrL2V4dGVybmFsIG5vZGUtY29tbW9uanMgXCJvc1wiIiwid2VicGFjazovL2RvY3RvcmRlc2svZXh0ZXJuYWwgbm9kZS1jb21tb25qcyBcInBhdGhcIiIsIndlYnBhY2s6Ly9kb2N0b3JkZXNrL2V4dGVybmFsIG5vZGUtY29tbW9uanMgXCJzdHJlYW1cIiIsIndlYnBhY2s6Ly9kb2N0b3JkZXNrL2V4dGVybmFsIG5vZGUtY29tbW9uanMgXCJ1dGlsXCIiLCJ3ZWJwYWNrOi8vZG9jdG9yZGVzay93ZWJwYWNrL2Jvb3RzdHJhcCIsIndlYnBhY2s6Ly9kb2N0b3JkZXNrL3dlYnBhY2svcnVudGltZS9oYXNPd25Qcm9wZXJ0eSBzaG9ydGhhbmQiLCJ3ZWJwYWNrOi8vZG9jdG9yZGVzay93ZWJwYWNrL3J1bnRpbWUvbm9kZSBtb2R1bGUgZGVjb3JhdG9yIiwid2VicGFjazovL2RvY3RvcmRlc2svLi9zcmMvY29tbWFuZC9pbmRleC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCdcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbih1c2FnZSwgZGVzY3JpcHRpb24sIGluaXQsIGFsaWFzZXMpIHtcbiAgaWYgKEFycmF5LmlzQXJyYXkoaW5pdCkpIHtcbiAgICBhbGlhc2VzID0gaW5pdFxuICAgIGluaXQgPSB1bmRlZmluZWRcbiAgfVxuXG4gIGlmIChhbGlhc2VzICYmIEFycmF5LmlzQXJyYXkoYWxpYXNlcykpIHtcbiAgICB1c2FnZSA9IFtdLmNvbmNhdChbdXNhZ2VdLCBhbGlhc2VzKVxuICB9XG5cbiAgLy8gUmVnaXN0ZXIgY29tbWFuZCB0byBnbG9iYWwgc2NvcGVcbiAgdGhpcy5kZXRhaWxzLmNvbW1hbmRzLnB1c2goe1xuICAgIHVzYWdlLFxuICAgIGRlc2NyaXB0aW9uLFxuICAgIGluaXQ6IHR5cGVvZiBpbml0ID09PSAnZnVuY3Rpb24nID8gaW5pdCA6IGZhbHNlXG4gIH0pXG5cbiAgLy8gQWxsb3cgY2hhaW5pbmcgb2YgLmNvbW1hbmQoKVxuICByZXR1cm4gdGhpc1xufVxuIiwiJ3VzZSBzdHJpY3QnXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24odXNhZ2UsIGRlc2NyaXB0aW9uKSB7XG4gIGlmICh0eXBlb2YgdXNhZ2UgIT09ICdzdHJpbmcnIHx8IHR5cGVvZiBkZXNjcmlwdGlvbiAhPT0gJ3N0cmluZycpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFxuICAgICAgJ1VzYWdlIGZvciBhZGRpbmcgYW4gRXhhbXBsZTogYXJncy5leGFtcGxlKFwidXNhZ2VcIiwgXCJkZXNjcmlwdGlvblwiKSdcbiAgICApXG4gIH1cblxuICB0aGlzLmRldGFpbHMuZXhhbXBsZXMucHVzaCh7IHVzYWdlLCBkZXNjcmlwdGlvbiB9KVxuXG4gIHJldHVybiB0aGlzXG59XG4iLCIndXNlIHN0cmljdCdcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihsaXN0KSB7XG4gIGlmIChsaXN0LmNvbnN0cnVjdG9yICE9PSBBcnJheSkge1xuICAgIHRocm93IG5ldyBFcnJvcignSXRlbSBwYXNzZWQgdG8gLmV4YW1wbGVzIGlzIG5vdCBhbiBhcnJheScpXG4gIH1cblxuICBmb3IgKGNvbnN0IGl0ZW0gb2YgbGlzdCkge1xuICAgIGNvbnN0IHVzYWdlID0gaXRlbS51c2FnZSB8fCBmYWxzZVxuICAgIGNvbnN0IGRlc2NyaXB0aW9uID0gaXRlbS5kZXNjcmlwdGlvbiB8fCBmYWxzZVxuICAgIHRoaXMuZXhhbXBsZSh1c2FnZSwgZGVzY3JpcHRpb24pXG4gIH1cblxuICByZXR1cm4gdGhpc1xufVxuIiwiJ3VzZSBzdHJpY3QnXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oKSB7XG4gIGNvbnN0IG5hbWUgPSB0aGlzLmNvbmZpZy5uYW1lIHx8IHRoaXMuYmluYXJ5LnJlcGxhY2UoJy0nLCAnICcpXG4gIGNvbnN0IGNhcGl0YWxpemUgPSB3b3JkID0+IHdvcmQuY2hhckF0KDApLnRvVXBwZXJDYXNlKCkgKyB3b3JkLnN1YnN0cigxKVxuXG4gIGNvbnN0IHBhcnRzID0gW11cblxuICBjb25zdCBncm91cHMgPSB7XG4gICAgY29tbWFuZHM6IHRydWUsXG4gICAgb3B0aW9uczogdHJ1ZSxcbiAgICBleGFtcGxlczogdHJ1ZVxuICB9XG5cbiAgZm9yIChjb25zdCBncm91cCBpbiBncm91cHMpIHtcbiAgICBpZiAodGhpcy5kZXRhaWxzW2dyb3VwXS5sZW5ndGggPiAwKSB7XG4gICAgICBjb250aW51ZVxuICAgIH1cblxuICAgIGdyb3Vwc1tncm91cF0gPSBmYWxzZVxuICB9XG5cbiAgY29uc3Qgb3B0aW9uSGFuZGxlID0gZ3JvdXBzLm9wdGlvbnMgPyAnW29wdGlvbnNdICcgOiAnJ1xuICBjb25zdCBjbWRIYW5kbGUgPSBncm91cHMuY29tbWFuZHMgPyAnW2NvbW1hbmRdJyA6ICcnXG4gIGNvbnN0IHZhbHVlID1cbiAgICB0eXBlb2YgdGhpcy5jb25maWcudmFsdWUgPT09ICdzdHJpbmcnID8gJyAnICsgdGhpcy5jb25maWcudmFsdWUgOiAnJ1xuXG4gIHBhcnRzLnB1c2goW1xuICAgIGAgIFVzYWdlOiAke3RoaXMucHJpbnRNYWluQ29sb3IobmFtZSl9ICR7dGhpcy5wcmludFN1YkNvbG9yKFxuICAgICAgb3B0aW9uSGFuZGxlICsgY21kSGFuZGxlICsgdmFsdWVcbiAgICApfWAsXG4gICAgJydcbiAgXSlcblxuICBmb3IgKGNvbnN0IGdyb3VwIGluIGdyb3Vwcykge1xuICAgIGlmICghZ3JvdXBzW2dyb3VwXSkge1xuICAgICAgY29udGludWVcbiAgICB9XG5cbiAgICBwYXJ0cy5wdXNoKFsnJywgY2FwaXRhbGl6ZShncm91cCkgKyAnOicsICcnXSlcblxuICAgIGlmIChncm91cCA9PT0gJ2V4YW1wbGVzJykge1xuICAgICAgcGFydHMucHVzaCh0aGlzLmdlbmVyYXRlRXhhbXBsZXMoKSlcbiAgICB9IGVsc2Uge1xuICAgICAgcGFydHMucHVzaCh0aGlzLmdlbmVyYXRlRGV0YWlscyhncm91cCkpXG4gICAgfVxuXG4gICAgcGFydHMucHVzaChbJycsICcnXSlcbiAgfVxuXG4gIGxldCBvdXRwdXQgPSAnJ1xuXG4gIC8vIEFuZCBmaW5hbGx5LCBtZXJnZSBhbmQgb3V0cHV0IHRoZW1cbiAgZm9yIChjb25zdCBwYXJ0IG9mIHBhcnRzKSB7XG4gICAgb3V0cHV0ICs9IHBhcnQuam9pbignXFxuICAnKVxuICB9XG5cbiAgaWYgKCFncm91cHMuY29tbWFuZHMgJiYgIWdyb3Vwcy5vcHRpb25zKSB7XG4gICAgb3V0cHV0ID0gJ05vIHN1YiBjb21tYW5kcyBvciBvcHRpb25zIGF2YWlsYWJsZSdcbiAgfVxuXG4gIGNvbnN0IHsgdXNhZ2VGaWx0ZXIgfSA9IHRoaXMuY29uZmlnXG5cbiAgLy8gSWYgZmlsdGVyIGlzIGF2YWlsYWJsZSwgcGFzcyB1c2FnZSBpbmZvcm1hdGlvbiB0aHJvdWdoXG4gIGlmICh0eXBlb2YgdXNhZ2VGaWx0ZXIgPT09ICdmdW5jdGlvbicpIHtcbiAgICBvdXRwdXQgPSB1c2FnZUZpbHRlcihvdXRwdXQpIHx8IG91dHB1dFxuICB9XG5cbiAgY29uc29sZS5sb2cob3V0cHV0KVxuXG4gIGlmICh0aGlzLmNvbmZpZy5leGl0ICYmIHRoaXMuY29uZmlnLmV4aXQuaGVscCkge1xuICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSB1bmljb3JuL25vLXByb2Nlc3MtZXhpdFxuICAgIHByb2Nlc3MuZXhpdCgpXG4gIH1cbn1cbiIsIid1c2Ugc3RyaWN0J1xuXG5jb25zdCBjaGFsayA9IHJlcXVpcmUoJ2NoYWxrJylcbmNvbnN0IHV0aWxzID0gcmVxdWlyZSgnLi91dGlscycpXG5cbmNvbnN0IHB1YmxpY01ldGhvZHMgPSB7XG4gIG9wdGlvbjogcmVxdWlyZSgnLi9vcHRpb24nKSxcbiAgb3B0aW9uczogcmVxdWlyZSgnLi9vcHRpb25zJyksXG4gIGNvbW1hbmQ6IHJlcXVpcmUoJy4vY29tbWFuZCcpLFxuICBwYXJzZTogcmVxdWlyZSgnLi9wYXJzZScpLFxuICBleGFtcGxlOiByZXF1aXJlKCcuL2V4YW1wbGUnKSxcbiAgZXhhbXBsZXM6IHJlcXVpcmUoJy4vZXhhbXBsZXMnKSxcbiAgc2hvd0hlbHA6IHJlcXVpcmUoJy4vaGVscCcpLFxuICBzaG93VmVyc2lvbjogcmVxdWlyZSgnLi92ZXJzaW9uJylcbn1cblxuZnVuY3Rpb24gQXJncygpIHtcbiAgdGhpcy5kZXRhaWxzID0ge1xuICAgIG9wdGlvbnM6IFtdLFxuICAgIGNvbW1hbmRzOiBbXSxcbiAgICBleGFtcGxlczogW11cbiAgfVxuXG4gIC8vIENvbmZpZ3VyYXRpb24gZGVmYXVsdHNcbiAgdGhpcy5jb25maWcgPSB7XG4gICAgZXhpdDogeyBoZWxwOiB0cnVlLCB2ZXJzaW9uOiB0cnVlIH0sXG4gICAgaGVscDogdHJ1ZSxcbiAgICB2ZXJzaW9uOiB0cnVlLFxuICAgIHVzYWdlRmlsdGVyOiBudWxsLFxuICAgIHZhbHVlOiBudWxsLFxuICAgIG5hbWU6IG51bGwsXG4gICAgbWFpbkNvbG9yOiAneWVsbG93JyxcbiAgICBzdWJDb2xvcjogJ2RpbSdcbiAgfVxuXG4gIHRoaXMucHJpbnRNYWluQ29sb3IgPSBjaGFsa1xuICB0aGlzLnByaW50U3ViQ29sb3IgPSBjaGFsa1xufVxuXG4vLyBBc3NpZ24gaW50ZXJuYWwgaGVscGVyc1xuZm9yIChjb25zdCB1dGlsIGluIHV0aWxzKSB7XG4gIGlmICghe30uaGFzT3duUHJvcGVydHkuY2FsbCh1dGlscywgdXRpbCkpIHtcbiAgICBjb250aW51ZVxuICB9XG5cbiAgQXJncy5wcm90b3R5cGVbdXRpbF0gPSB1dGlsc1t1dGlsXVxufVxuXG4vLyBBc3NpZ24gcHVibGljIG1ldGhvZHNcbmZvciAoY29uc3QgbWV0aG9kIGluIHB1YmxpY01ldGhvZHMpIHtcbiAgaWYgKCF7fS5oYXNPd25Qcm9wZXJ0eS5jYWxsKHB1YmxpY01ldGhvZHMsIG1ldGhvZCkpIHtcbiAgICBjb250aW51ZVxuICB9XG5cbiAgQXJncy5wcm90b3R5cGVbbWV0aG9kXSA9IHB1YmxpY01ldGhvZHNbbWV0aG9kXVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IG5ldyBBcmdzKClcbm1vZHVsZS5leHBvcnRzLkFyZ3MgPSBBcmdzO1xuIiwiJ3VzZSBzdHJpY3QnXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24obmFtZSwgZGVzY3JpcHRpb24sIGRlZmF1bHRWYWx1ZSwgaW5pdCkge1xuICBsZXQgdXNhZ2UgPSBbXVxuXG4gIGNvbnN0IGFzc2lnblNob3J0ID0gKG5hbWUsIG9wdGlvbnMsIHNob3J0KSA9PiB7XG4gICAgaWYgKG9wdGlvbnMuZmluZChmbGFnTmFtZSA9PiBmbGFnTmFtZS51c2FnZVswXSA9PT0gc2hvcnQpKSB7XG4gICAgICBzaG9ydCA9IG5hbWUuY2hhckF0KDApLnRvVXBwZXJDYXNlKClcbiAgICB9XG5cbiAgICByZXR1cm4gW3Nob3J0LCBuYW1lXVxuICB9XG5cbiAgLy8gSWYgbmFtZSBpcyBhbiBhcnJheSwgcGljayB0aGUgdmFsdWVzXG4gIC8vIE90aGVyd2lzZSBqdXN0IHVzZSB0aGUgd2hvbGUgdGhpbmdcbiAgc3dpdGNoIChuYW1lLmNvbnN0cnVjdG9yKSB7XG4gICAgY2FzZSBTdHJpbmc6XG4gICAgICB1c2FnZSA9IGFzc2lnblNob3J0KG5hbWUsIHRoaXMuZGV0YWlscy5vcHRpb25zLCBuYW1lLmNoYXJBdCgwKSlcbiAgICAgIGJyZWFrXG4gICAgY2FzZSBBcnJheTpcbiAgICAgIHVzYWdlID0gdXNhZ2UuY29uY2F0KG5hbWUpXG4gICAgICBicmVha1xuICAgIGRlZmF1bHQ6XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgbmFtZSBmb3Igb3B0aW9uJylcbiAgfVxuXG4gIC8vIFRocm93IGVycm9yIGlmIHNob3J0IG9wdGlvbiBpcyB0b28gbG9uZ1xuICBpZiAodXNhZ2UubGVuZ3RoID4gMCAmJiB1c2FnZVswXS5sZW5ndGggPiAxKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdTaG9ydCB2ZXJzaW9uIG9mIG9wdGlvbiBpcyBsb25nZXIgdGhhbiAxIGNoYXInKVxuICB9XG5cbiAgY29uc3Qgb3B0aW9uRGV0YWlscyA9IHtcbiAgICBkZWZhdWx0VmFsdWUsXG4gICAgdXNhZ2UsXG4gICAgZGVzY3JpcHRpb25cbiAgfVxuXG4gIGxldCBkZWZhdWx0SXNXcm9uZ1xuXG4gIHN3aXRjaCAoZGVmYXVsdFZhbHVlKSB7XG4gICAgY2FzZSBmYWxzZTpcbiAgICAgIGRlZmF1bHRJc1dyb25nID0gdHJ1ZVxuICAgICAgYnJlYWtcbiAgICBjYXNlIG51bGw6XG4gICAgICBkZWZhdWx0SXNXcm9uZyA9IHRydWVcbiAgICAgIGJyZWFrXG4gICAgY2FzZSB1bmRlZmluZWQ6XG4gICAgICBkZWZhdWx0SXNXcm9uZyA9IHRydWVcbiAgICAgIGJyZWFrXG4gICAgZGVmYXVsdDpcbiAgICAgIGRlZmF1bHRJc1dyb25nID0gZmFsc2VcbiAgfVxuXG4gIGlmICh0eXBlb2YgaW5pdCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIG9wdGlvbkRldGFpbHMuaW5pdCA9IGluaXRcbiAgfSBlbHNlIGlmICghZGVmYXVsdElzV3JvbmcpIHtcbiAgICAvLyBTZXQgaW5pdGlhbGl6ZXIgZGVwZW5kaW5nIG9uIHR5cGUgb2YgZGVmYXVsdCB2YWx1ZVxuICAgIG9wdGlvbkRldGFpbHMuaW5pdCA9IHRoaXMuaGFuZGxlVHlwZShkZWZhdWx0VmFsdWUpWzFdXG4gIH1cblxuICAvLyBSZWdpc3RlciBvcHRpb24gdG8gZ2xvYmFsIHNjb3BlXG4gIHRoaXMuZGV0YWlscy5vcHRpb25zLnB1c2gob3B0aW9uRGV0YWlscylcblxuICAvLyBBbGxvdyBjaGFpbmluZyBvZiAub3B0aW9uKClcbiAgcmV0dXJuIHRoaXNcbn1cbiIsIid1c2Ugc3RyaWN0J1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGxpc3QpIHtcbiAgaWYgKGxpc3QuY29uc3RydWN0b3IgIT09IEFycmF5KSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdJdGVtIHBhc3NlZCB0byAub3B0aW9ucyBpcyBub3QgYW4gYXJyYXknKVxuICB9XG5cbiAgZm9yIChjb25zdCBpdGVtIG9mIGxpc3QpIHtcbiAgICBjb25zdCBwcmVzZXQgPSBpdGVtLmRlZmF1bHRWYWx1ZVxuICAgIGNvbnN0IGluaXQgPSBpdGVtLmluaXQgfHwgZmFsc2VcblxuICAgIHRoaXMub3B0aW9uKGl0ZW0ubmFtZSwgaXRlbS5kZXNjcmlwdGlvbiwgcHJlc2V0LCBpbml0KVxuICB9XG5cbiAgcmV0dXJuIHRoaXNcbn1cbiIsIid1c2Ugc3RyaWN0J1xuXG5jb25zdCBwYXRoID0gcmVxdWlyZSgncGF0aCcpXG5jb25zdCBwYXJzZXIgPSByZXF1aXJlKCdtcmknKVxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGFyZ3YsIG9wdGlvbnMpIHtcbiAgLy8gT3ZlcnJpZGUgZGVmYXVsdCBvcHRpb24gdmFsdWVzXG4gIE9iamVjdC5hc3NpZ24odGhpcy5jb25maWcsIG9wdGlvbnMpXG5cbiAgaWYgKEFycmF5LmlzQXJyYXkodGhpcy5jb25maWcubWFpbkNvbG9yKSkge1xuICAgIGZvciAoY29uc3QgaXRlbSBpbiB0aGlzLmNvbmZpZy5tYWluQ29sb3IpIHtcbiAgICAgIGlmICghe30uaGFzT3duUHJvcGVydHkuY2FsbCh0aGlzLmNvbmZpZy5tYWluQ29sb3IsIGl0ZW0pKSB7XG4gICAgICAgIGNvbnRpbnVlXG4gICAgICB9XG5cbiAgICAgIC8vIENoYWluIGFsbCBjb2xvcnMgdG8gb3VyIHByaW50IG1ldGhvZFxuICAgICAgdGhpcy5wcmludE1haW5Db2xvciA9IHRoaXMucHJpbnRNYWluQ29sb3JbdGhpcy5jb25maWcubWFpbkNvbG9yW2l0ZW1dXVxuICAgIH1cbiAgfSBlbHNlIHtcbiAgICB0aGlzLnByaW50TWFpbkNvbG9yID0gdGhpcy5wcmludE1haW5Db2xvclt0aGlzLmNvbmZpZy5tYWluQ29sb3JdXG4gIH1cblxuICBpZiAoQXJyYXkuaXNBcnJheSh0aGlzLmNvbmZpZy5zdWJDb2xvcikpIHtcbiAgICBmb3IgKGNvbnN0IGl0ZW0gaW4gdGhpcy5jb25maWcuc3ViQ29sb3IpIHtcbiAgICAgIGlmICghe30uaGFzT3duUHJvcGVydHkuY2FsbCh0aGlzLmNvbmZpZy5zdWJDb2xvciwgaXRlbSkpIHtcbiAgICAgICAgY29udGludWVcbiAgICAgIH1cblxuICAgICAgLy8gQ2hhaW4gYWxsIGNvbG9ycyB0byBvdXIgcHJpbnQgbWV0aG9kXG4gICAgICB0aGlzLnByaW50U3ViQ29sb3IgPSB0aGlzLnByaW50U3ViQ29sb3JbdGhpcy5jb25maWcuc3ViQ29sb3JbaXRlbV1dXG4gICAgfVxuICB9IGVsc2Uge1xuICAgIHRoaXMucHJpbnRTdWJDb2xvciA9IHRoaXMucHJpbnRTdWJDb2xvclt0aGlzLmNvbmZpZy5zdWJDb2xvcl1cbiAgfVxuXG4gIC8vIFBhcnNlIGFyZ3VtZW50cyB1c2luZyBtcmlcbiAgdGhpcy5yYXcgPSBwYXJzZXIoYXJndi5zbGljZSgxKSwgdGhpcy5jb25maWcubXJpIHx8IHRoaXMuY29uZmlnLm1pbmltaXN0KVxuICB0aGlzLmJpbmFyeSA9IHBhdGguYmFzZW5hbWUodGhpcy5yYXcuX1swXSlcblxuICAvLyBJZiBkZWZhdWx0IHZlcnNpb24gaXMgYWxsb3dlZCwgY2hlY2sgZm9yIGl0XG4gIGlmICh0aGlzLmNvbmZpZy52ZXJzaW9uKSB7XG4gICAgdGhpcy5jaGVja1ZlcnNpb24oKVxuICB9XG5cbiAgLy8gSWYgZGVmYXVsdCBoZWxwIGlzIGFsbG93ZWQsIGNoZWNrIGZvciBpdFxuICBpZiAodGhpcy5jb25maWcuaGVscCkge1xuICAgIHRoaXMuY2hlY2tIZWxwKClcbiAgfVxuXG4gIGNvbnN0IHN1YkNvbW1hbmQgPSB0aGlzLnJhdy5fWzFdXG4gIGNvbnN0IGFyZ3MgPSB7fVxuICBjb25zdCBkZWZpbmVkID0gdGhpcy5pc0RlZmluZWQoc3ViQ29tbWFuZCwgJ2NvbW1hbmRzJylcbiAgY29uc3Qgb3B0aW9uTGlzdCA9IHRoaXMuZ2V0T3B0aW9ucyhkZWZpbmVkKVxuXG4gIE9iamVjdC5hc3NpZ24oYXJncywgdGhpcy5yYXcpXG4gIGFyZ3MuXy5zaGlmdCgpXG5cbiAgLy8gRXhwb3J0IHN1YiBhcmd1bWVudHMgb2YgY29tbWFuZFxuICB0aGlzLnN1YiA9IGFyZ3MuX1xuXG4gIC8vIElmIHN1YiBjb21tYW5kIGlzIGRlZmluZWQsIHJ1biBpdFxuICBpZiAoZGVmaW5lZCkge1xuICAgIHRoaXMucnVuQ29tbWFuZChkZWZpbmVkLCBvcHRpb25MaXN0KVxuICAgIHJldHVybiB7fVxuICB9XG5cbiAgLy8gSGFuZCBiYWNrIGxpc3Qgb2Ygb3B0aW9uc1xuICByZXR1cm4gb3B0aW9uTGlzdFxufVxuIiwiJ3VzZSBzdHJpY3QnXG5cbmNvbnN0IHsgc3Bhd24gfSA9IHJlcXVpcmUoJ2NoaWxkX3Byb2Nlc3MnKVxuY29uc3QgcGF0aCA9IHJlcXVpcmUoJ3BhdGgnKVxuY29uc3QgY2FtZWxjYXNlID0gcmVxdWlyZSgnY2FtZWxjYXNlJylcbmNvbnN0IGxldmVuID0gcmVxdWlyZSgnbGV2ZW4nKVxuXG5mdW5jdGlvbiBzaW1pbGFyaXR5QmVzdE1hdGNoKG1haW5TdHJpbmcsIHRhcmdldFN0cmluZ3MpIHtcbiAgbGV0IGJlc3RNYXRjaFxuICBjb25zdCByYXRpbmdzID0gdGFyZ2V0U3RyaW5ncy5tYXAodGFyZ2V0U3RyaW5nID0+IHtcbiAgICBjb25zdCBzY29yZSA9IGxldmVuKG1haW5TdHJpbmcsIHRhcmdldFN0cmluZylcblxuICAgIGNvbnN0IHJlcyA9IHtcbiAgICAgIHRhcmdldDogdGFyZ2V0U3RyaW5nLFxuICAgICAgcmF0aW5nOiBsZXZlbihtYWluU3RyaW5nLCB0YXJnZXRTdHJpbmcpXG4gICAgfVxuXG4gICAgaWYgKCFiZXN0TWF0Y2ggfHwgc2NvcmUgPCBiZXN0TWF0Y2gucmF0aW5nKSBiZXN0TWF0Y2ggPSByZXNcblxuICAgIHJldHVybiByZXNcbiAgfSlcblxuICByZXR1cm4ge1xuICAgIHJhdGluZ3MsXG4gICAgYmVzdE1hdGNoXG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIGhhbmRsZVR5cGUodmFsdWUpIHtcbiAgICBsZXQgdHlwZSA9IHZhbHVlXG4gICAgaWYgKHR5cGVvZiB2YWx1ZSAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgdHlwZSA9IHZhbHVlLmNvbnN0cnVjdG9yXG4gICAgfVxuXG4gICAgLy8gRGVwZW5kaW5nIG9uIHRoZSB0eXBlIG9mIHRoZSBkZWZhdWx0IHZhbHVlLFxuICAgIC8vIHNlbGVjdCBhIGRlZmF1bHQgaW5pdGlhbGl6ZXIgZnVuY3Rpb25cbiAgICBzd2l0Y2ggKHR5cGUpIHtcbiAgICAgIGNhc2UgU3RyaW5nOlxuICAgICAgICByZXR1cm4gWydbdmFsdWVdJ11cbiAgICAgIGNhc2UgQXJyYXk6XG4gICAgICAgIHJldHVybiBbJzxsaXN0PiddXG4gICAgICBjYXNlIE51bWJlcjpcbiAgICAgIGNhc2UgcGFyc2VJbnQ6XG4gICAgICAgIHJldHVybiBbJzxuPicsIHBhcnNlSW50XVxuICAgICAgZGVmYXVsdDpcbiAgICAgICAgcmV0dXJuIFsnJ11cbiAgICB9XG4gIH0sXG5cbiAgcmVhZE9wdGlvbihvcHRpb24pIHtcbiAgICBsZXQgdmFsdWUgPSBvcHRpb24uZGVmYXVsdFZhbHVlXG4gICAgY29uc3QgY29udGVudHMgPSB7fVxuXG4gICAgLy8gSWYgb3B0aW9uIGhhcyBiZWVuIHVzZWQsIGdldCBpdHMgdmFsdWVcbiAgICBmb3IgKGNvbnN0IG5hbWUgb2Ygb3B0aW9uLnVzYWdlKSB7XG4gICAgICBjb25zdCBmcm9tQXJncyA9IHRoaXMucmF3W25hbWVdXG4gICAgICBpZiAodHlwZW9mIGZyb21BcmdzICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICB2YWx1ZSA9IGZyb21BcmdzXG4gICAgICAgIGJyZWFrXG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gUHJvY2VzcyB0aGUgb3B0aW9uJ3MgdmFsdWVcbiAgICBmb3IgKGxldCBuYW1lIG9mIG9wdGlvbi51c2FnZSkge1xuICAgICAgbGV0IHByb3BWYWwgPSB2YWx1ZVxuXG4gICAgICAvLyBDb252ZXJ0IHRoZSB2YWx1ZSB0byBhbiBhcnJheSB3aGVuIHRoZSBvcHRpb24gaXMgY2FsbGVkIGp1c3Qgb25jZVxuICAgICAgaWYgKFxuICAgICAgICBBcnJheS5pc0FycmF5KG9wdGlvbi5kZWZhdWx0VmFsdWUpICYmXG4gICAgICAgIHR5cGVvZiBwcm9wVmFsICE9PSB0eXBlb2Ygb3B0aW9uLmRlZmF1bHRWYWx1ZVxuICAgICAgKSB7XG4gICAgICAgIHByb3BWYWwgPSBbcHJvcFZhbF1cbiAgICAgIH1cblxuICAgICAgaWYgKFxuICAgICAgICB0eXBlb2Ygb3B0aW9uLmRlZmF1bHRWYWx1ZSAhPT0gJ3VuZGVmaW5lZCcgJiZcbiAgICAgICAgdHlwZW9mIHByb3BWYWwgIT09IHR5cGVvZiBvcHRpb24uZGVmYXVsdFZhbHVlXG4gICAgICApIHtcbiAgICAgICAgcHJvcFZhbCA9IG9wdGlvbi5kZWZhdWx0VmFsdWVcbiAgICAgIH1cblxuICAgICAgbGV0IGNvbmRpdGlvbiA9IHRydWVcblxuICAgICAgaWYgKG9wdGlvbi5pbml0KSB7XG4gICAgICAgIC8vIE9ubHkgdXNlIHRoZSB0b1N0cmluZyBpbml0aWFsaXplciBpZiB2YWx1ZSBpcyBhIG51bWJlclxuICAgICAgICBpZiAob3B0aW9uLmluaXQgPT09IHRvU3RyaW5nKSB7XG4gICAgICAgICAgY29uZGl0aW9uID0gcHJvcFZhbC5jb25zdHJ1Y3RvciA9PT0gTnVtYmVyXG4gICAgICAgIH1cblxuICAgICAgICBpZiAoY29uZGl0aW9uKSB7XG4gICAgICAgICAgLy8gUGFzcyBpdCB0aHJvdWdoIHRoZSBpbml0aWFsaXplclxuICAgICAgICAgIHByb3BWYWwgPSBvcHRpb24uaW5pdChwcm9wVmFsKVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIENhbWVsY2FzZSBvcHRpb24gbmFtZSAoc2tpcCBzaG9ydCBmbGFnKVxuICAgICAgaWYgKG5hbWUubGVuZ3RoID4gMSkge1xuICAgICAgICBuYW1lID0gY2FtZWxjYXNlKG5hbWUpXG4gICAgICB9XG5cbiAgICAgIC8vIEFkZCBvcHRpb24gdG8gbGlzdFxuICAgICAgY29udGVudHNbbmFtZV0gPSBwcm9wVmFsXG4gICAgfVxuXG4gICAgcmV0dXJuIGNvbnRlbnRzXG4gIH0sXG5cbiAgZ2V0T3B0aW9ucyhkZWZpbmVkU3ViY29tbWFuZCkge1xuICAgIGNvbnN0IG9wdGlvbnMgPSB7fVxuICAgIGNvbnN0IGFyZ3MgPSB7fVxuXG4gICAgLy8gQ29weSBvdmVyIHRoZSBhcmd1bWVudHNcbiAgICBPYmplY3QuYXNzaWduKGFyZ3MsIHRoaXMucmF3KVxuICAgIGRlbGV0ZSBhcmdzLl9cblxuICAgIC8vIFNldCBvcHRpb24gZGVmYXVsdHNcbiAgICBmb3IgKGNvbnN0IG9wdGlvbiBvZiB0aGlzLmRldGFpbHMub3B0aW9ucykge1xuICAgICAgaWYgKHR5cGVvZiBvcHRpb24uZGVmYXVsdFZhbHVlID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICBjb250aW51ZVxuICAgICAgfVxuXG4gICAgICBPYmplY3QuYXNzaWduKG9wdGlvbnMsIHRoaXMucmVhZE9wdGlvbihvcHRpb24pKVxuICAgIH1cblxuICAgIC8vIE92ZXJyaWRlIGRlZmF1bHRzIGlmIHVzZWQgaW4gY29tbWFuZCBsaW5lXG4gICAgZm9yIChjb25zdCBvcHRpb24gaW4gYXJncykge1xuICAgICAgaWYgKCF7fS5oYXNPd25Qcm9wZXJ0eS5jYWxsKGFyZ3MsIG9wdGlvbikpIHtcbiAgICAgICAgY29udGludWVcbiAgICAgIH1cblxuICAgICAgY29uc3QgcmVsYXRlZCA9IHRoaXMuaXNEZWZpbmVkKG9wdGlvbiwgJ29wdGlvbnMnKVxuXG4gICAgICBpZiAocmVsYXRlZCkge1xuICAgICAgICBjb25zdCBkZXRhaWxzID0gdGhpcy5yZWFkT3B0aW9uKHJlbGF0ZWQpXG4gICAgICAgIE9iamVjdC5hc3NpZ24ob3B0aW9ucywgZGV0YWlscylcbiAgICAgIH1cblxuICAgICAgaWYgKCFyZWxhdGVkICYmICFkZWZpbmVkU3ViY29tbWFuZCkge1xuICAgICAgICAvLyBVbmtub3duIE9wdGlvblxuICAgICAgICBjb25zdCBhdmFpbGFibGVPcHRpb25zID0gW11cbiAgICAgICAgdGhpcy5kZXRhaWxzLm9wdGlvbnMuZm9yRWFjaChvcHQgPT4ge1xuICAgICAgICAgIGF2YWlsYWJsZU9wdGlvbnMucHVzaCguLi5vcHQudXNhZ2UpXG4gICAgICAgIH0pXG5cbiAgICAgICAgY29uc3Qgc3VnZ2VzdE9wdGlvbiA9IHNpbWlsYXJpdHlCZXN0TWF0Y2gob3B0aW9uLCBhdmFpbGFibGVPcHRpb25zKVxuXG4gICAgICAgIHByb2Nlc3Muc3Rkb3V0LndyaXRlKGBUaGUgb3B0aW9uIFwiJHtvcHRpb259XCIgaXMgdW5rbm93bi5gKVxuXG4gICAgICAgIGlmIChzdWdnZXN0T3B0aW9uLmJlc3RNYXRjaC5yYXRpbmcgPj0gMC41KSB7XG4gICAgICAgICAgcHJvY2Vzcy5zdGRvdXQud3JpdGUoJyBEaWQgeW91IG1lYW4gdGhlIGZvbGxvd2luZyBvbmU/XFxuJylcblxuICAgICAgICAgIGNvbnN0IHN1Z2dlc3Rpb24gPSB0aGlzLmRldGFpbHMub3B0aW9ucy5maWx0ZXIoaXRlbSA9PiB7XG4gICAgICAgICAgICBmb3IgKGNvbnN0IGZsYWcgb2YgaXRlbS51c2FnZSkge1xuICAgICAgICAgICAgICBpZiAoZmxhZyA9PT0gc3VnZ2VzdE9wdGlvbi5iZXN0TWF0Y2gudGFyZ2V0KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWVcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gZmFsc2VcbiAgICAgICAgICB9KVxuXG4gICAgICAgICAgcHJvY2Vzcy5zdGRvdXQud3JpdGUoXG4gICAgICAgICAgICB0aGlzLmdlbmVyYXRlRGV0YWlscyhzdWdnZXN0aW9uKVswXS50cmltKCkgKyAnXFxuJ1xuICAgICAgICAgIClcblxuICAgICAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSB1bmljb3JuL25vLXByb2Nlc3MtZXhpdFxuICAgICAgICAgIHByb2Nlc3MuZXhpdCgpXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcHJvY2Vzcy5zdGRvdXQud3JpdGUoYCBIZXJlJ3MgYSBsaXN0IG9mIGFsbCBhdmFpbGFibGUgb3B0aW9uczogXFxuYClcbiAgICAgICAgICB0aGlzLnNob3dIZWxwKClcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBvcHRpb25zXG4gIH0sXG5cbiAgZ2VuZXJhdGVFeGFtcGxlcygpIHtcbiAgICBjb25zdCB7IGV4YW1wbGVzIH0gPSB0aGlzLmRldGFpbHNcbiAgICBjb25zdCBwYXJ0cyA9IFtdXG5cbiAgICBmb3IgKGNvbnN0IGl0ZW0gaW4gZXhhbXBsZXMpIHtcbiAgICAgIGlmICghe30uaGFzT3duUHJvcGVydHkuY2FsbChleGFtcGxlcywgaXRlbSkpIHtcbiAgICAgICAgY29udGludWVcbiAgICAgIH1cblxuICAgICAgY29uc3QgdXNhZ2UgPSB0aGlzLnByaW50U3ViQ29sb3IoJyQgJyArIGV4YW1wbGVzW2l0ZW1dLnVzYWdlKVxuICAgICAgY29uc3QgZGVzY3JpcHRpb24gPSB0aGlzLnByaW50TWFpbkNvbG9yKCctICcgKyBleGFtcGxlc1tpdGVtXS5kZXNjcmlwdGlvbilcbiAgICAgIHBhcnRzLnB1c2goYCAgJHtkZXNjcmlwdGlvbn1cXG4gICAgJHt1c2FnZX1cXG5gKVxuICAgIH1cblxuICAgIHJldHVybiBwYXJ0c1xuICB9LFxuXG4gIGdlbmVyYXRlRGV0YWlscyhraW5kKSB7XG4gICAgLy8gR2V0IGFsbCBwcm9wZXJ0aWVzIG9mIGtpbmQgZnJvbSBnbG9iYWwgc2NvcGVcbiAgICBjb25zdCBpdGVtcyA9IFtdXG5cbiAgICAvLyBDbG9uZSBwYXNzZWQgb2JqZWN0cyBzbyBjaGFuZ2luZyB0aGVtIGhlcmUgZG9lc24ndCBhZmZlY3QgcmVhbCBkYXRhLlxuICAgIGNvbnN0IHBhc3NlZCA9IFtdLmNvbmNhdChcbiAgICAgIHR5cGVvZiBraW5kID09PSAnc3RyaW5nJyA/IHRoaXMuZGV0YWlsc1traW5kXSA6IGtpbmRcbiAgICApXG4gICAgZm9yIChsZXQgaSA9IDAsIGwgPSBwYXNzZWQubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgICBpdGVtcy5wdXNoKE9iamVjdC5hc3NpZ24oe30sIHBhc3NlZFtpXSkpXG4gICAgfVxuXG4gICAgY29uc3QgcGFydHMgPSBbXVxuICAgIGNvbnN0IGlzQ21kID0ga2luZCA9PT0gJ2NvbW1hbmRzJ1xuXG4gICAgLy8gU29ydCBpdGVtcyBhbHBoYWJldGljYWxseVxuICAgIGl0ZW1zLnNvcnQoKGEsIGIpID0+IHtcbiAgICAgIGNvbnN0IGZpcnN0ID0gaXNDbWQgPyBhLnVzYWdlIDogYS51c2FnZVsxXVxuICAgICAgY29uc3Qgc2Vjb25kID0gaXNDbWQgPyBiLnVzYWdlIDogYi51c2FnZVsxXVxuXG4gICAgICBzd2l0Y2ggKHRydWUpIHtcbiAgICAgICAgY2FzZSBmaXJzdCA8IHNlY29uZDpcbiAgICAgICAgICByZXR1cm4gLTFcbiAgICAgICAgY2FzZSBmaXJzdCA+IHNlY29uZDpcbiAgICAgICAgICByZXR1cm4gMVxuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgIHJldHVybiAwXG4gICAgICB9XG4gICAgfSlcblxuICAgIGZvciAoY29uc3QgaXRlbSBpbiBpdGVtcykge1xuICAgICAgaWYgKCF7fS5oYXNPd25Qcm9wZXJ0eS5jYWxsKGl0ZW1zLCBpdGVtKSkge1xuICAgICAgICBjb250aW51ZVxuICAgICAgfVxuXG4gICAgICBsZXQgeyB1c2FnZSB9ID0gaXRlbXNbaXRlbV1cbiAgICAgIGxldCBpbml0aWFsID0gaXRlbXNbaXRlbV0uZGVmYXVsdFZhbHVlXG5cbiAgICAgIC8vIElmIHVzYWdlIGlzIGFuIGFycmF5LCBzaG93IGl0cyBjb250ZW50c1xuICAgICAgaWYgKHVzYWdlLmNvbnN0cnVjdG9yID09PSBBcnJheSkge1xuICAgICAgICBpZiAoaXNDbWQpIHtcbiAgICAgICAgICB1c2FnZSA9IHVzYWdlLmpvaW4oJywgJylcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBjb25zdCBpc1ZlcnNpb24gPSB1c2FnZS5pbmRleE9mKCd2JylcbiAgICAgICAgICB1c2FnZSA9IGAtJHt1c2FnZVswXX0sIC0tJHt1c2FnZVsxXX1gXG5cbiAgICAgICAgICBpZiAoIWluaXRpYWwpIHtcbiAgICAgICAgICAgIGluaXRpYWwgPSBpdGVtc1tpdGVtXS5pbml0XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgdXNhZ2UgKz1cbiAgICAgICAgICAgIGluaXRpYWwgJiYgaXNWZXJzaW9uID09PSAtMSA/ICcgJyArIHRoaXMuaGFuZGxlVHlwZShpbml0aWFsKVswXSA6ICcnXG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gT3ZlcndyaXRlIHVzYWdlIHdpdGggcmVhZGFibGUgc3ludGF4XG4gICAgICBpdGVtc1tpdGVtXS51c2FnZSA9IHVzYWdlXG4gICAgfVxuXG4gICAgLy8gRmluZCBsZW5ndGggb2YgbG9uZ2VzdCBvcHRpb24gb3IgY29tbWFuZFxuICAgIC8vIEJlZm9yZSBkb2luZyB0aGF0LCBtYWtlIGEgY29weSBvZiB0aGUgb3JpZ2luYWwgYXJyYXlcbiAgICBjb25zdCBsb25nZXN0ID0gaXRlbXMuc2xpY2UoKS5zb3J0KChhLCBiKSA9PiB7XG4gICAgICByZXR1cm4gYi51c2FnZS5sZW5ndGggLSBhLnVzYWdlLmxlbmd0aFxuICAgIH0pWzBdLnVzYWdlLmxlbmd0aFxuXG4gICAgZm9yIChjb25zdCBpdGVtIG9mIGl0ZW1zKSB7XG4gICAgICBsZXQgeyB1c2FnZSwgZGVzY3JpcHRpb24sIGRlZmF1bHRWYWx1ZSB9ID0gaXRlbVxuICAgICAgY29uc3QgZGlmZmVyZW5jZSA9IGxvbmdlc3QgLSB1c2FnZS5sZW5ndGhcblxuICAgICAgLy8gQ29tcGVuc2F0ZSB0aGUgZGlmZmVyZW5jZSB0byBsb25nZXN0IHByb3BlcnR5IHdpdGggc3BhY2VzXG4gICAgICB1c2FnZSArPSAnICcucmVwZWF0KGRpZmZlcmVuY2UpXG5cbiAgICAgIC8vIEFkZCBzb21lIHNwYWNlIGFyb3VuZCBpdCBhcyB3ZWxsXG4gICAgICBpZiAodHlwZW9mIGRlZmF1bHRWYWx1ZSAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBkZWZhdWx0VmFsdWUgPT09ICdib29sZWFuJykge1xuICAgICAgICAgIGRlc2NyaXB0aW9uICs9IGAgKCR7XG4gICAgICAgICAgICBkZWZhdWx0VmFsdWUgPyAnZW5hYmxlZCcgOiAnZGlzYWJsZWQnXG4gICAgICAgICAgfSBieSBkZWZhdWx0KWBcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBkZXNjcmlwdGlvbiArPSBgIChkZWZhdWx0cyB0byAke0pTT04uc3RyaW5naWZ5KGRlZmF1bHRWYWx1ZSl9KWBcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBwYXJ0cy5wdXNoKFxuICAgICAgICAnICAnICtcbiAgICAgICAgICB0aGlzLnByaW50TWFpbkNvbG9yKHVzYWdlKSArXG4gICAgICAgICAgJyAgJyArXG4gICAgICAgICAgdGhpcy5wcmludFN1YkNvbG9yKGRlc2NyaXB0aW9uKVxuICAgICAgKVxuICAgIH1cblxuICAgIHJldHVybiBwYXJ0c1xuICB9LFxuXG4gIHJ1bkNvbW1hbmQoZGV0YWlscywgb3B0aW9ucykge1xuICAgIC8vIElmIGhlbHAgaXMgZGlzYWJsZWQsIHJlbW92ZSBpbml0aWFsaXplclxuICAgIGlmIChkZXRhaWxzLnVzYWdlID09PSAnaGVscCcgJiYgIXRoaXMuY29uZmlnLmhlbHApIHtcbiAgICAgIGRldGFpbHMuaW5pdCA9IGZhbHNlXG4gICAgfVxuXG4gICAgLy8gSWYgdmVyc2lvbiBpcyBkaXNhYmxlZCwgcmVtb3ZlIGluaXRpYWxpemVyXG4gICAgaWYgKGRldGFpbHMudXNhZ2UgPT09ICd2ZXJzaW9uJyAmJiAhdGhpcy5jb25maWcudmVyc2lvbikge1xuICAgICAgZGV0YWlscy5pbml0ID0gZmFsc2VcbiAgICB9XG5cbiAgICAvLyBJZiBjb21tYW5kIGhhcyBpbml0aWFsaXplciwgY2FsbCBpdFxuICAgIGlmIChkZXRhaWxzLmluaXQpIHtcbiAgICAgIGNvbnN0IHN1YiA9IFtdLmNvbmNhdCh0aGlzLnN1YilcbiAgICAgIHN1Yi5zaGlmdCgpXG5cbiAgICAgIHJldHVybiBkZXRhaWxzLmluaXQuYmluZCh0aGlzKShkZXRhaWxzLnVzYWdlLCBzdWIsIG9wdGlvbnMpXG4gICAgfVxuXG4gICAgLy8gR2VuZXJhdGUgZnVsbCBuYW1lIG9mIGJpbmFyeVxuICAgIGNvbnN0IHN1YkNvbW1hbmQgPSBBcnJheS5pc0FycmF5KGRldGFpbHMudXNhZ2UpXG4gICAgICA/IGRldGFpbHMudXNhZ2VbMF1cbiAgICAgIDogZGV0YWlscy51c2FnZVxuICAgIGxldCBmdWxsID0gdGhpcy5iaW5hcnkgKyAnLScgKyBzdWJDb21tYW5kXG5cbiAgICAvLyBSZW1vdmUgbm9kZSBhbmQgb3JpZ2luYWwgY29tbWFuZC5cbiAgICBjb25zdCBhcmdzID0gcHJvY2Vzcy5hcmd2LnNsaWNlKDIpXG5cbiAgICAvLyBSZW1vdmUgdGhlIGZpcnN0IG9jY3VyYW5jZSBvZiBzdWJDb21tYW5kIGZyb20gdGhlIGFyZ3MuXG4gICAgZm9yIChsZXQgaSA9IDAsIGwgPSBhcmdzLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgaWYgKGFyZ3NbaV0gPT09IHN1YkNvbW1hbmQpIHtcbiAgICAgICAgYXJncy5zcGxpY2UoaSwgMSlcbiAgICAgICAgYnJlYWtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAocHJvY2Vzcy5wbGF0Zm9ybSA9PT0gJ3dpbjMyJykge1xuICAgICAgY29uc3QgYmluYXJ5RXh0ID0gcGF0aC5leHRuYW1lKHRoaXMuYmluYXJ5KVxuICAgICAgY29uc3QgbWFpbk1vZHVsZSA9IHByb2Nlc3MuZW52LkFQUFZFWU9SXG4gICAgICAgID8gJ19maXh0dXJlJ1xuICAgICAgICA6IHByb2Nlc3MubWFpbk1vZHVsZS5maWxlbmFtZVxuXG4gICAgICBmdWxsID0gYCR7bWFpbk1vZHVsZX0tJHtzdWJDb21tYW5kfWBcblxuICAgICAgaWYgKHBhdGguZXh0bmFtZSh0aGlzLmJpbmFyeSkpIHtcbiAgICAgICAgZnVsbCA9IGAke21haW5Nb2R1bGUucmVwbGFjZShiaW5hcnlFeHQsICcnKX0tJHtzdWJDb21tYW5kfSR7YmluYXJ5RXh0fWBcbiAgICAgIH1cblxuICAgICAgLy8gUnVuIGJpbmFyeSBvZiBzdWIgY29tbWFuZCBvbiB3aW5kb3dzXG4gICAgICBhcmdzLnVuc2hpZnQoZnVsbClcbiAgICAgIHRoaXMuY2hpbGQgPSBzcGF3bihwcm9jZXNzLmV4ZWNQYXRoLCBhcmdzLCB7XG4gICAgICAgIHN0ZGlvOiAnaW5oZXJpdCdcbiAgICAgIH0pXG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIFJ1biBiaW5hcnkgb2Ygc3ViIGNvbW1hbmRcbiAgICAgIHRoaXMuY2hpbGQgPSBzcGF3bihmdWxsLCBhcmdzLCB7XG4gICAgICAgIHN0ZGlvOiAnaW5oZXJpdCdcbiAgICAgIH0pXG4gICAgfVxuXG4gICAgLy8gVGhyb3cgYW4gZXJyb3IgaWYgc29tZXRoaW5nIGZhaWxzIHdpdGhpbiB0aGF0IGJpbmFyeVxuICAgIHRoaXMuY2hpbGQub24oJ2Vycm9yJywgZXJyID0+IHtcbiAgICAgIHRocm93IGVyclxuICAgIH0pXG5cbiAgICB0aGlzLmNoaWxkLm9uKCdleGl0JywgKGNvZGUsIHNpZ25hbCkgPT4ge1xuICAgICAgcHJvY2Vzcy5vbignZXhpdCcsICgpID0+IHtcbiAgICAgICAgdGhpcy5jaGlsZCA9IG51bGxcbiAgICAgICAgaWYgKHNpZ25hbCkge1xuICAgICAgICAgIHByb2Nlc3Mua2lsbChwcm9jZXNzLnBpZCwgc2lnbmFsKVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHByb2Nlc3MuZXhpdChjb2RlKVxuICAgICAgICB9XG4gICAgICB9KVxuICAgIH0pXG5cbiAgICAvLyBQcm94eSBTSUdJTlQgdG8gY2hpbGQgcHJvY2Vzc1xuICAgIHByb2Nlc3Mub24oJ1NJR0lOVCcsICgpID0+IHtcbiAgICAgIGlmICh0aGlzLmNoaWxkKSB7XG4gICAgICAgIHRoaXMuY2hpbGQua2lsbCgnU0lHSU5UJylcbiAgICAgICAgdGhpcy5jaGlsZC5raWxsKCdTSUdURVJNJykgLy8gSWYgdGhhdCBkaWRuJ3Qgd29yaywgd2UncmUgcHJvYmFibHkgaW4gYW4gaW5maW5pdGUgbG9vcCwgc28gbWFrZSBpdCBkaWVcbiAgICAgIH1cbiAgICB9KVxuICB9LFxuXG4gIGNoZWNrSGVscCgpIHtcbiAgICAvLyBSZWdpc3RlciBkZWZhdWx0IG9wdGlvbiBhbmQgY29tbWFuZC5cbiAgICB0aGlzLm9wdGlvbignaGVscCcsICdPdXRwdXQgdXNhZ2UgaW5mb3JtYXRpb24nKVxuICAgIHRoaXMuY29tbWFuZCgnaGVscCcsICdEaXNwbGF5IGhlbHAnLCB0aGlzLnNob3dIZWxwKVxuXG4gICAgLy8gSW1tZWRpYXRlbHkgb3V0cHV0IGlmIG9wdGlvbiB3YXMgcHJvdmlkZWQuXG4gICAgaWYgKHRoaXMub3B0aW9uV2FzUHJvdmlkZWQoJ2hlbHAnKSkge1xuICAgICAgdGhpcy5zaG93SGVscCgpXG4gICAgfVxuICB9LFxuXG4gIGNoZWNrVmVyc2lvbigpIHtcbiAgICAvLyBSZWdpc3RlciBkZWZhdWx0IG9wdGlvbiBhbmQgY29tbWFuZC5cbiAgICB0aGlzLm9wdGlvbigndmVyc2lvbicsICdPdXRwdXQgdGhlIHZlcnNpb24gbnVtYmVyJylcbiAgICB0aGlzLmNvbW1hbmQoJ3ZlcnNpb24nLCAnRGlzcGxheSB2ZXJzaW9uJywgdGhpcy5zaG93VmVyc2lvbilcblxuICAgIC8vIEltbWVkaWF0ZWx5IG91dHB1dCBpZiBvcHRpb24gd2FzIHByb3ZpZGVkLlxuICAgIGlmICh0aGlzLm9wdGlvbldhc1Byb3ZpZGVkKCd2ZXJzaW9uJykpIHtcbiAgICAgIHRoaXMuc2hvd1ZlcnNpb24oKVxuICAgIH1cbiAgfSxcblxuICBpc0RlZmluZWQobmFtZSwgbGlzdCkge1xuICAgIC8vIEdldCBhbGwgaXRlbXMgb2Yga2luZFxuICAgIGNvbnN0IGNoaWxkcmVuID0gdGhpcy5kZXRhaWxzW2xpc3RdXG5cbiAgICAvLyBDaGVjayBpZiBhIGNoaWxkIG1hdGNoZXMgdGhlIHJlcXVlc3RlZCBuYW1lXG4gICAgZm9yIChjb25zdCBjaGlsZCBvZiBjaGlsZHJlbikge1xuICAgICAgY29uc3QgeyB1c2FnZSB9ID0gY2hpbGRcbiAgICAgIGNvbnN0IHR5cGUgPSB1c2FnZS5jb25zdHJ1Y3RvclxuXG4gICAgICBpZiAodHlwZSA9PT0gQXJyYXkgJiYgdXNhZ2UuaW5kZXhPZihuYW1lKSA+IC0xKSB7XG4gICAgICAgIHJldHVybiBjaGlsZFxuICAgICAgfVxuXG4gICAgICBpZiAodHlwZSA9PT0gU3RyaW5nICYmIHVzYWdlID09PSBuYW1lKSB7XG4gICAgICAgIHJldHVybiBjaGlsZFxuICAgICAgfVxuICAgIH1cblxuICAgIC8vIElmIG5vdGhpbmcgbWF0Y2hlcywgaXRlbSBpcyBub3QgZGVmaW5lZFxuICAgIHJldHVybiBmYWxzZVxuICB9LFxuXG4gIG9wdGlvbldhc1Byb3ZpZGVkKG5hbWUpIHtcbiAgICBjb25zdCBvcHRpb24gPSB0aGlzLmlzRGVmaW5lZChuYW1lLCAnb3B0aW9ucycpXG4gICAgcmV0dXJuIG9wdGlvbiAmJiAodGhpcy5yYXdbb3B0aW9uLnVzYWdlWzBdXSB8fCB0aGlzLnJhd1tvcHRpb24udXNhZ2VbMV1dKVxuICB9XG59XG4iLCIndXNlIHN0cmljdCdcblxuY29uc3QgZnMgPSByZXF1aXJlKCdmcycpXG5jb25zdCBwYXRoID0gcmVxdWlyZSgncGF0aCcpXG5cbi8qKlxuICogUmV0cmlldmVzIHRoZSBtYWluIG1vZHVsZSBwYWNrYWdlLmpzb24gaW5mb3JtYXRpb24uXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IGRpcmVjdG9yeVxuICogICBUaGUgZGlyZWN0b3J5IHRvIHN0YXJ0IGxvb2tpbmcgaW4uXG4gKlxuICogQHJldHVybiB7T2JqZWN0fG51bGx9XG4gKiAgIEFuIG9iamVjdCBjb250YWluaW5nIHRoZSBwYWNrYWdlLmpzb24gY29udGVudHMgb3IgTlVMTCBpZiBpdCBjb3VsZCBub3QgYmUgZm91bmQuXG4gKi9cbmZ1bmN0aW9uIGZpbmRQYWNrYWdlKGRpcmVjdG9yeSkge1xuICBjb25zdCBmaWxlID0gcGF0aC5yZXNvbHZlKGRpcmVjdG9yeSwgJ3BhY2thZ2UuanNvbicpXG4gIGlmIChmcy5leGlzdHNTeW5jKGZpbGUpICYmIGZzLnN0YXRTeW5jKGZpbGUpLmlzRmlsZSgpKSB7XG4gICAgcmV0dXJuIHJlcXVpcmUoZmlsZSlcbiAgfVxuXG4gIGNvbnN0IHBhcmVudCA9IHBhdGgucmVzb2x2ZShkaXJlY3RvcnksICcuLicpXG4gIHJldHVybiBwYXJlbnQgPT09IGRpcmVjdG9yeSA/IG51bGwgOiBmaW5kUGFja2FnZShwYXJlbnQpXG59XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oKSB7XG4gIGNvbnN0IHBrZyA9IGZpbmRQYWNrYWdlKHBhdGguZGlybmFtZShwcm9jZXNzLm1haW5Nb2R1bGUuZmlsZW5hbWUpKVxuICBjb25zdCB2ZXJzaW9uID0gKHBrZyAmJiBwa2cudmVyc2lvbikgfHwgJy0vLSdcblxuICBjb25zb2xlLmxvZyh2ZXJzaW9uKVxuXG4gIGlmICh0aGlzLmNvbmZpZy5leGl0ICYmIHRoaXMuY29uZmlnLmV4aXQudmVyc2lvbikge1xuICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSB1bmljb3JuL25vLXByb2Nlc3MtZXhpdFxuICAgIHByb2Nlc3MuZXhpdCgpXG4gIH1cbn1cbiIsImZ1bmN0aW9uIHdlYnBhY2tFbXB0eUNvbnRleHQocmVxKSB7XG5cdHZhciBlID0gbmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIiArIHJlcSArIFwiJ1wiKTtcblx0ZS5jb2RlID0gJ01PRFVMRV9OT1RfRk9VTkQnO1xuXHR0aHJvdyBlO1xufVxud2VicGFja0VtcHR5Q29udGV4dC5rZXlzID0gKCkgPT4gKFtdKTtcbndlYnBhY2tFbXB0eUNvbnRleHQucmVzb2x2ZSA9IHdlYnBhY2tFbXB0eUNvbnRleHQ7XG53ZWJwYWNrRW1wdHlDb250ZXh0LmlkID0gXCIuL25vZGVfbW9kdWxlcy9hcmdzL2xpYiBzeW5jIHJlY3Vyc2l2ZVwiO1xubW9kdWxlLmV4cG9ydHMgPSB3ZWJwYWNrRW1wdHlDb250ZXh0OyIsIid1c2Ugc3RyaWN0JztcbmNvbnN0IGNvbG9yQ29udmVydCA9IHJlcXVpcmUoJ2NvbG9yLWNvbnZlcnQnKTtcblxuY29uc3Qgd3JhcEFuc2kxNiA9IChmbiwgb2Zmc2V0KSA9PiBmdW5jdGlvbiAoKSB7XG5cdGNvbnN0IGNvZGUgPSBmbi5hcHBseShjb2xvckNvbnZlcnQsIGFyZ3VtZW50cyk7XG5cdHJldHVybiBgXFx1MDAxQlske2NvZGUgKyBvZmZzZXR9bWA7XG59O1xuXG5jb25zdCB3cmFwQW5zaTI1NiA9IChmbiwgb2Zmc2V0KSA9PiBmdW5jdGlvbiAoKSB7XG5cdGNvbnN0IGNvZGUgPSBmbi5hcHBseShjb2xvckNvbnZlcnQsIGFyZ3VtZW50cyk7XG5cdHJldHVybiBgXFx1MDAxQlskezM4ICsgb2Zmc2V0fTs1OyR7Y29kZX1tYDtcbn07XG5cbmNvbnN0IHdyYXBBbnNpMTZtID0gKGZuLCBvZmZzZXQpID0+IGZ1bmN0aW9uICgpIHtcblx0Y29uc3QgcmdiID0gZm4uYXBwbHkoY29sb3JDb252ZXJ0LCBhcmd1bWVudHMpO1xuXHRyZXR1cm4gYFxcdTAwMUJbJHszOCArIG9mZnNldH07Mjske3JnYlswXX07JHtyZ2JbMV19OyR7cmdiWzJdfW1gO1xufTtcblxuZnVuY3Rpb24gYXNzZW1ibGVTdHlsZXMoKSB7XG5cdGNvbnN0IGNvZGVzID0gbmV3IE1hcCgpO1xuXHRjb25zdCBzdHlsZXMgPSB7XG5cdFx0bW9kaWZpZXI6IHtcblx0XHRcdHJlc2V0OiBbMCwgMF0sXG5cdFx0XHQvLyAyMSBpc24ndCB3aWRlbHkgc3VwcG9ydGVkIGFuZCAyMiBkb2VzIHRoZSBzYW1lIHRoaW5nXG5cdFx0XHRib2xkOiBbMSwgMjJdLFxuXHRcdFx0ZGltOiBbMiwgMjJdLFxuXHRcdFx0aXRhbGljOiBbMywgMjNdLFxuXHRcdFx0dW5kZXJsaW5lOiBbNCwgMjRdLFxuXHRcdFx0aW52ZXJzZTogWzcsIDI3XSxcblx0XHRcdGhpZGRlbjogWzgsIDI4XSxcblx0XHRcdHN0cmlrZXRocm91Z2g6IFs5LCAyOV1cblx0XHR9LFxuXHRcdGNvbG9yOiB7XG5cdFx0XHRibGFjazogWzMwLCAzOV0sXG5cdFx0XHRyZWQ6IFszMSwgMzldLFxuXHRcdFx0Z3JlZW46IFszMiwgMzldLFxuXHRcdFx0eWVsbG93OiBbMzMsIDM5XSxcblx0XHRcdGJsdWU6IFszNCwgMzldLFxuXHRcdFx0bWFnZW50YTogWzM1LCAzOV0sXG5cdFx0XHRjeWFuOiBbMzYsIDM5XSxcblx0XHRcdHdoaXRlOiBbMzcsIDM5XSxcblx0XHRcdGdyYXk6IFs5MCwgMzldLFxuXG5cdFx0XHQvLyBCcmlnaHQgY29sb3Jcblx0XHRcdHJlZEJyaWdodDogWzkxLCAzOV0sXG5cdFx0XHRncmVlbkJyaWdodDogWzkyLCAzOV0sXG5cdFx0XHR5ZWxsb3dCcmlnaHQ6IFs5MywgMzldLFxuXHRcdFx0Ymx1ZUJyaWdodDogWzk0LCAzOV0sXG5cdFx0XHRtYWdlbnRhQnJpZ2h0OiBbOTUsIDM5XSxcblx0XHRcdGN5YW5CcmlnaHQ6IFs5NiwgMzldLFxuXHRcdFx0d2hpdGVCcmlnaHQ6IFs5NywgMzldXG5cdFx0fSxcblx0XHRiZ0NvbG9yOiB7XG5cdFx0XHRiZ0JsYWNrOiBbNDAsIDQ5XSxcblx0XHRcdGJnUmVkOiBbNDEsIDQ5XSxcblx0XHRcdGJnR3JlZW46IFs0MiwgNDldLFxuXHRcdFx0YmdZZWxsb3c6IFs0MywgNDldLFxuXHRcdFx0YmdCbHVlOiBbNDQsIDQ5XSxcblx0XHRcdGJnTWFnZW50YTogWzQ1LCA0OV0sXG5cdFx0XHRiZ0N5YW46IFs0NiwgNDldLFxuXHRcdFx0YmdXaGl0ZTogWzQ3LCA0OV0sXG5cblx0XHRcdC8vIEJyaWdodCBjb2xvclxuXHRcdFx0YmdCbGFja0JyaWdodDogWzEwMCwgNDldLFxuXHRcdFx0YmdSZWRCcmlnaHQ6IFsxMDEsIDQ5XSxcblx0XHRcdGJnR3JlZW5CcmlnaHQ6IFsxMDIsIDQ5XSxcblx0XHRcdGJnWWVsbG93QnJpZ2h0OiBbMTAzLCA0OV0sXG5cdFx0XHRiZ0JsdWVCcmlnaHQ6IFsxMDQsIDQ5XSxcblx0XHRcdGJnTWFnZW50YUJyaWdodDogWzEwNSwgNDldLFxuXHRcdFx0YmdDeWFuQnJpZ2h0OiBbMTA2LCA0OV0sXG5cdFx0XHRiZ1doaXRlQnJpZ2h0OiBbMTA3LCA0OV1cblx0XHR9XG5cdH07XG5cblx0Ly8gRml4IGh1bWFuc1xuXHRzdHlsZXMuY29sb3IuZ3JleSA9IHN0eWxlcy5jb2xvci5ncmF5O1xuXG5cdGZvciAoY29uc3QgZ3JvdXBOYW1lIG9mIE9iamVjdC5rZXlzKHN0eWxlcykpIHtcblx0XHRjb25zdCBncm91cCA9IHN0eWxlc1tncm91cE5hbWVdO1xuXG5cdFx0Zm9yIChjb25zdCBzdHlsZU5hbWUgb2YgT2JqZWN0LmtleXMoZ3JvdXApKSB7XG5cdFx0XHRjb25zdCBzdHlsZSA9IGdyb3VwW3N0eWxlTmFtZV07XG5cblx0XHRcdHN0eWxlc1tzdHlsZU5hbWVdID0ge1xuXHRcdFx0XHRvcGVuOiBgXFx1MDAxQlske3N0eWxlWzBdfW1gLFxuXHRcdFx0XHRjbG9zZTogYFxcdTAwMUJbJHtzdHlsZVsxXX1tYFxuXHRcdFx0fTtcblxuXHRcdFx0Z3JvdXBbc3R5bGVOYW1lXSA9IHN0eWxlc1tzdHlsZU5hbWVdO1xuXG5cdFx0XHRjb2Rlcy5zZXQoc3R5bGVbMF0sIHN0eWxlWzFdKTtcblx0XHR9XG5cblx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoc3R5bGVzLCBncm91cE5hbWUsIHtcblx0XHRcdHZhbHVlOiBncm91cCxcblx0XHRcdGVudW1lcmFibGU6IGZhbHNlXG5cdFx0fSk7XG5cblx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoc3R5bGVzLCAnY29kZXMnLCB7XG5cdFx0XHR2YWx1ZTogY29kZXMsXG5cdFx0XHRlbnVtZXJhYmxlOiBmYWxzZVxuXHRcdH0pO1xuXHR9XG5cblx0Y29uc3QgYW5zaTJhbnNpID0gbiA9PiBuO1xuXHRjb25zdCByZ2IycmdiID0gKHIsIGcsIGIpID0+IFtyLCBnLCBiXTtcblxuXHRzdHlsZXMuY29sb3IuY2xvc2UgPSAnXFx1MDAxQlszOW0nO1xuXHRzdHlsZXMuYmdDb2xvci5jbG9zZSA9ICdcXHUwMDFCWzQ5bSc7XG5cblx0c3R5bGVzLmNvbG9yLmFuc2kgPSB7XG5cdFx0YW5zaTogd3JhcEFuc2kxNihhbnNpMmFuc2ksIDApXG5cdH07XG5cdHN0eWxlcy5jb2xvci5hbnNpMjU2ID0ge1xuXHRcdGFuc2kyNTY6IHdyYXBBbnNpMjU2KGFuc2kyYW5zaSwgMClcblx0fTtcblx0c3R5bGVzLmNvbG9yLmFuc2kxNm0gPSB7XG5cdFx0cmdiOiB3cmFwQW5zaTE2bShyZ2IycmdiLCAwKVxuXHR9O1xuXG5cdHN0eWxlcy5iZ0NvbG9yLmFuc2kgPSB7XG5cdFx0YW5zaTogd3JhcEFuc2kxNihhbnNpMmFuc2ksIDEwKVxuXHR9O1xuXHRzdHlsZXMuYmdDb2xvci5hbnNpMjU2ID0ge1xuXHRcdGFuc2kyNTY6IHdyYXBBbnNpMjU2KGFuc2kyYW5zaSwgMTApXG5cdH07XG5cdHN0eWxlcy5iZ0NvbG9yLmFuc2kxNm0gPSB7XG5cdFx0cmdiOiB3cmFwQW5zaTE2bShyZ2IycmdiLCAxMClcblx0fTtcblxuXHRmb3IgKGxldCBrZXkgb2YgT2JqZWN0LmtleXMoY29sb3JDb252ZXJ0KSkge1xuXHRcdGlmICh0eXBlb2YgY29sb3JDb252ZXJ0W2tleV0gIT09ICdvYmplY3QnKSB7XG5cdFx0XHRjb250aW51ZTtcblx0XHR9XG5cblx0XHRjb25zdCBzdWl0ZSA9IGNvbG9yQ29udmVydFtrZXldO1xuXG5cdFx0aWYgKGtleSA9PT0gJ2Fuc2kxNicpIHtcblx0XHRcdGtleSA9ICdhbnNpJztcblx0XHR9XG5cblx0XHRpZiAoJ2Fuc2kxNicgaW4gc3VpdGUpIHtcblx0XHRcdHN0eWxlcy5jb2xvci5hbnNpW2tleV0gPSB3cmFwQW5zaTE2KHN1aXRlLmFuc2kxNiwgMCk7XG5cdFx0XHRzdHlsZXMuYmdDb2xvci5hbnNpW2tleV0gPSB3cmFwQW5zaTE2KHN1aXRlLmFuc2kxNiwgMTApO1xuXHRcdH1cblxuXHRcdGlmICgnYW5zaTI1NicgaW4gc3VpdGUpIHtcblx0XHRcdHN0eWxlcy5jb2xvci5hbnNpMjU2W2tleV0gPSB3cmFwQW5zaTI1NihzdWl0ZS5hbnNpMjU2LCAwKTtcblx0XHRcdHN0eWxlcy5iZ0NvbG9yLmFuc2kyNTZba2V5XSA9IHdyYXBBbnNpMjU2KHN1aXRlLmFuc2kyNTYsIDEwKTtcblx0XHR9XG5cblx0XHRpZiAoJ3JnYicgaW4gc3VpdGUpIHtcblx0XHRcdHN0eWxlcy5jb2xvci5hbnNpMTZtW2tleV0gPSB3cmFwQW5zaTE2bShzdWl0ZS5yZ2IsIDApO1xuXHRcdFx0c3R5bGVzLmJnQ29sb3IuYW5zaTE2bVtrZXldID0gd3JhcEFuc2kxNm0oc3VpdGUucmdiLCAxMCk7XG5cdFx0fVxuXHR9XG5cblx0cmV0dXJuIHN0eWxlcztcbn1cblxuLy8gTWFrZSB0aGUgZXhwb3J0IGltbXV0YWJsZVxuT2JqZWN0LmRlZmluZVByb3BlcnR5KG1vZHVsZSwgJ2V4cG9ydHMnLCB7XG5cdGVudW1lcmFibGU6IHRydWUsXG5cdGdldDogYXNzZW1ibGVTdHlsZXNcbn0pO1xuIiwiJ3VzZSBzdHJpY3QnO1xuY29uc3QgZXNjYXBlU3RyaW5nUmVnZXhwID0gcmVxdWlyZSgnZXNjYXBlLXN0cmluZy1yZWdleHAnKTtcbmNvbnN0IGFuc2lTdHlsZXMgPSByZXF1aXJlKCdhbnNpLXN0eWxlcycpO1xuY29uc3Qgc3Rkb3V0Q29sb3IgPSByZXF1aXJlKCdzdXBwb3J0cy1jb2xvcicpLnN0ZG91dDtcblxuY29uc3QgdGVtcGxhdGUgPSByZXF1aXJlKCcuL3RlbXBsYXRlcy5qcycpO1xuXG5jb25zdCBpc1NpbXBsZVdpbmRvd3NUZXJtID0gcHJvY2Vzcy5wbGF0Zm9ybSA9PT0gJ3dpbjMyJyAmJiAhKHByb2Nlc3MuZW52LlRFUk0gfHwgJycpLnRvTG93ZXJDYXNlKCkuc3RhcnRzV2l0aCgneHRlcm0nKTtcblxuLy8gYHN1cHBvcnRzQ29sb3IubGV2ZWxgIOKGkiBgYW5zaVN0eWxlcy5jb2xvcltuYW1lXWAgbWFwcGluZ1xuY29uc3QgbGV2ZWxNYXBwaW5nID0gWydhbnNpJywgJ2Fuc2knLCAnYW5zaTI1NicsICdhbnNpMTZtJ107XG5cbi8vIGBjb2xvci1jb252ZXJ0YCBtb2RlbHMgdG8gZXhjbHVkZSBmcm9tIHRoZSBDaGFsayBBUEkgZHVlIHRvIGNvbmZsaWN0cyBhbmQgc3VjaFxuY29uc3Qgc2tpcE1vZGVscyA9IG5ldyBTZXQoWydncmF5J10pO1xuXG5jb25zdCBzdHlsZXMgPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuXG5mdW5jdGlvbiBhcHBseU9wdGlvbnMob2JqLCBvcHRpb25zKSB7XG5cdG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuXG5cdC8vIERldGVjdCBsZXZlbCBpZiBub3Qgc2V0IG1hbnVhbGx5XG5cdGNvbnN0IHNjTGV2ZWwgPSBzdGRvdXRDb2xvciA/IHN0ZG91dENvbG9yLmxldmVsIDogMDtcblx0b2JqLmxldmVsID0gb3B0aW9ucy5sZXZlbCA9PT0gdW5kZWZpbmVkID8gc2NMZXZlbCA6IG9wdGlvbnMubGV2ZWw7XG5cdG9iai5lbmFibGVkID0gJ2VuYWJsZWQnIGluIG9wdGlvbnMgPyBvcHRpb25zLmVuYWJsZWQgOiBvYmoubGV2ZWwgPiAwO1xufVxuXG5mdW5jdGlvbiBDaGFsayhvcHRpb25zKSB7XG5cdC8vIFdlIGNoZWNrIGZvciB0aGlzLnRlbXBsYXRlIGhlcmUgc2luY2UgY2FsbGluZyBgY2hhbGsuY29uc3RydWN0b3IoKWBcblx0Ly8gYnkgaXRzZWxmIHdpbGwgaGF2ZSBhIGB0aGlzYCBvZiBhIHByZXZpb3VzbHkgY29uc3RydWN0ZWQgY2hhbGsgb2JqZWN0XG5cdGlmICghdGhpcyB8fCAhKHRoaXMgaW5zdGFuY2VvZiBDaGFsaykgfHwgdGhpcy50ZW1wbGF0ZSkge1xuXHRcdGNvbnN0IGNoYWxrID0ge307XG5cdFx0YXBwbHlPcHRpb25zKGNoYWxrLCBvcHRpb25zKTtcblxuXHRcdGNoYWxrLnRlbXBsYXRlID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0Y29uc3QgYXJncyA9IFtdLnNsaWNlLmNhbGwoYXJndW1lbnRzKTtcblx0XHRcdHJldHVybiBjaGFsa1RhZy5hcHBseShudWxsLCBbY2hhbGsudGVtcGxhdGVdLmNvbmNhdChhcmdzKSk7XG5cdFx0fTtcblxuXHRcdE9iamVjdC5zZXRQcm90b3R5cGVPZihjaGFsaywgQ2hhbGsucHJvdG90eXBlKTtcblx0XHRPYmplY3Quc2V0UHJvdG90eXBlT2YoY2hhbGsudGVtcGxhdGUsIGNoYWxrKTtcblxuXHRcdGNoYWxrLnRlbXBsYXRlLmNvbnN0cnVjdG9yID0gQ2hhbGs7XG5cblx0XHRyZXR1cm4gY2hhbGsudGVtcGxhdGU7XG5cdH1cblxuXHRhcHBseU9wdGlvbnModGhpcywgb3B0aW9ucyk7XG59XG5cbi8vIFVzZSBicmlnaHQgYmx1ZSBvbiBXaW5kb3dzIGFzIHRoZSBub3JtYWwgYmx1ZSBjb2xvciBpcyBpbGxlZ2libGVcbmlmIChpc1NpbXBsZVdpbmRvd3NUZXJtKSB7XG5cdGFuc2lTdHlsZXMuYmx1ZS5vcGVuID0gJ1xcdTAwMUJbOTRtJztcbn1cblxuZm9yIChjb25zdCBrZXkgb2YgT2JqZWN0LmtleXMoYW5zaVN0eWxlcykpIHtcblx0YW5zaVN0eWxlc1trZXldLmNsb3NlUmUgPSBuZXcgUmVnRXhwKGVzY2FwZVN0cmluZ1JlZ2V4cChhbnNpU3R5bGVzW2tleV0uY2xvc2UpLCAnZycpO1xuXG5cdHN0eWxlc1trZXldID0ge1xuXHRcdGdldCgpIHtcblx0XHRcdGNvbnN0IGNvZGVzID0gYW5zaVN0eWxlc1trZXldO1xuXHRcdFx0cmV0dXJuIGJ1aWxkLmNhbGwodGhpcywgdGhpcy5fc3R5bGVzID8gdGhpcy5fc3R5bGVzLmNvbmNhdChjb2RlcykgOiBbY29kZXNdLCB0aGlzLl9lbXB0eSwga2V5KTtcblx0XHR9XG5cdH07XG59XG5cbnN0eWxlcy52aXNpYmxlID0ge1xuXHRnZXQoKSB7XG5cdFx0cmV0dXJuIGJ1aWxkLmNhbGwodGhpcywgdGhpcy5fc3R5bGVzIHx8IFtdLCB0cnVlLCAndmlzaWJsZScpO1xuXHR9XG59O1xuXG5hbnNpU3R5bGVzLmNvbG9yLmNsb3NlUmUgPSBuZXcgUmVnRXhwKGVzY2FwZVN0cmluZ1JlZ2V4cChhbnNpU3R5bGVzLmNvbG9yLmNsb3NlKSwgJ2cnKTtcbmZvciAoY29uc3QgbW9kZWwgb2YgT2JqZWN0LmtleXMoYW5zaVN0eWxlcy5jb2xvci5hbnNpKSkge1xuXHRpZiAoc2tpcE1vZGVscy5oYXMobW9kZWwpKSB7XG5cdFx0Y29udGludWU7XG5cdH1cblxuXHRzdHlsZXNbbW9kZWxdID0ge1xuXHRcdGdldCgpIHtcblx0XHRcdGNvbnN0IGxldmVsID0gdGhpcy5sZXZlbDtcblx0XHRcdHJldHVybiBmdW5jdGlvbiAoKSB7XG5cdFx0XHRcdGNvbnN0IG9wZW4gPSBhbnNpU3R5bGVzLmNvbG9yW2xldmVsTWFwcGluZ1tsZXZlbF1dW21vZGVsXS5hcHBseShudWxsLCBhcmd1bWVudHMpO1xuXHRcdFx0XHRjb25zdCBjb2RlcyA9IHtcblx0XHRcdFx0XHRvcGVuLFxuXHRcdFx0XHRcdGNsb3NlOiBhbnNpU3R5bGVzLmNvbG9yLmNsb3NlLFxuXHRcdFx0XHRcdGNsb3NlUmU6IGFuc2lTdHlsZXMuY29sb3IuY2xvc2VSZVxuXHRcdFx0XHR9O1xuXHRcdFx0XHRyZXR1cm4gYnVpbGQuY2FsbCh0aGlzLCB0aGlzLl9zdHlsZXMgPyB0aGlzLl9zdHlsZXMuY29uY2F0KGNvZGVzKSA6IFtjb2Rlc10sIHRoaXMuX2VtcHR5LCBtb2RlbCk7XG5cdFx0XHR9O1xuXHRcdH1cblx0fTtcbn1cblxuYW5zaVN0eWxlcy5iZ0NvbG9yLmNsb3NlUmUgPSBuZXcgUmVnRXhwKGVzY2FwZVN0cmluZ1JlZ2V4cChhbnNpU3R5bGVzLmJnQ29sb3IuY2xvc2UpLCAnZycpO1xuZm9yIChjb25zdCBtb2RlbCBvZiBPYmplY3Qua2V5cyhhbnNpU3R5bGVzLmJnQ29sb3IuYW5zaSkpIHtcblx0aWYgKHNraXBNb2RlbHMuaGFzKG1vZGVsKSkge1xuXHRcdGNvbnRpbnVlO1xuXHR9XG5cblx0Y29uc3QgYmdNb2RlbCA9ICdiZycgKyBtb2RlbFswXS50b1VwcGVyQ2FzZSgpICsgbW9kZWwuc2xpY2UoMSk7XG5cdHN0eWxlc1tiZ01vZGVsXSA9IHtcblx0XHRnZXQoKSB7XG5cdFx0XHRjb25zdCBsZXZlbCA9IHRoaXMubGV2ZWw7XG5cdFx0XHRyZXR1cm4gZnVuY3Rpb24gKCkge1xuXHRcdFx0XHRjb25zdCBvcGVuID0gYW5zaVN0eWxlcy5iZ0NvbG9yW2xldmVsTWFwcGluZ1tsZXZlbF1dW21vZGVsXS5hcHBseShudWxsLCBhcmd1bWVudHMpO1xuXHRcdFx0XHRjb25zdCBjb2RlcyA9IHtcblx0XHRcdFx0XHRvcGVuLFxuXHRcdFx0XHRcdGNsb3NlOiBhbnNpU3R5bGVzLmJnQ29sb3IuY2xvc2UsXG5cdFx0XHRcdFx0Y2xvc2VSZTogYW5zaVN0eWxlcy5iZ0NvbG9yLmNsb3NlUmVcblx0XHRcdFx0fTtcblx0XHRcdFx0cmV0dXJuIGJ1aWxkLmNhbGwodGhpcywgdGhpcy5fc3R5bGVzID8gdGhpcy5fc3R5bGVzLmNvbmNhdChjb2RlcykgOiBbY29kZXNdLCB0aGlzLl9lbXB0eSwgbW9kZWwpO1xuXHRcdFx0fTtcblx0XHR9XG5cdH07XG59XG5cbmNvbnN0IHByb3RvID0gT2JqZWN0LmRlZmluZVByb3BlcnRpZXMoKCkgPT4ge30sIHN0eWxlcyk7XG5cbmZ1bmN0aW9uIGJ1aWxkKF9zdHlsZXMsIF9lbXB0eSwga2V5KSB7XG5cdGNvbnN0IGJ1aWxkZXIgPSBmdW5jdGlvbiAoKSB7XG5cdFx0cmV0dXJuIGFwcGx5U3R5bGUuYXBwbHkoYnVpbGRlciwgYXJndW1lbnRzKTtcblx0fTtcblxuXHRidWlsZGVyLl9zdHlsZXMgPSBfc3R5bGVzO1xuXHRidWlsZGVyLl9lbXB0eSA9IF9lbXB0eTtcblxuXHRjb25zdCBzZWxmID0gdGhpcztcblxuXHRPYmplY3QuZGVmaW5lUHJvcGVydHkoYnVpbGRlciwgJ2xldmVsJywge1xuXHRcdGVudW1lcmFibGU6IHRydWUsXG5cdFx0Z2V0KCkge1xuXHRcdFx0cmV0dXJuIHNlbGYubGV2ZWw7XG5cdFx0fSxcblx0XHRzZXQobGV2ZWwpIHtcblx0XHRcdHNlbGYubGV2ZWwgPSBsZXZlbDtcblx0XHR9XG5cdH0pO1xuXG5cdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShidWlsZGVyLCAnZW5hYmxlZCcsIHtcblx0XHRlbnVtZXJhYmxlOiB0cnVlLFxuXHRcdGdldCgpIHtcblx0XHRcdHJldHVybiBzZWxmLmVuYWJsZWQ7XG5cdFx0fSxcblx0XHRzZXQoZW5hYmxlZCkge1xuXHRcdFx0c2VsZi5lbmFibGVkID0gZW5hYmxlZDtcblx0XHR9XG5cdH0pO1xuXG5cdC8vIFNlZSBiZWxvdyBmb3IgZml4IHJlZ2FyZGluZyBpbnZpc2libGUgZ3JleS9kaW0gY29tYmluYXRpb24gb24gV2luZG93c1xuXHRidWlsZGVyLmhhc0dyZXkgPSB0aGlzLmhhc0dyZXkgfHwga2V5ID09PSAnZ3JheScgfHwga2V5ID09PSAnZ3JleSc7XG5cblx0Ly8gYF9fcHJvdG9fX2AgaXMgdXNlZCBiZWNhdXNlIHdlIG11c3QgcmV0dXJuIGEgZnVuY3Rpb24sIGJ1dCB0aGVyZSBpc1xuXHQvLyBubyB3YXkgdG8gY3JlYXRlIGEgZnVuY3Rpb24gd2l0aCBhIGRpZmZlcmVudCBwcm90b3R5cGVcblx0YnVpbGRlci5fX3Byb3RvX18gPSBwcm90bzsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1wcm90b1xuXG5cdHJldHVybiBidWlsZGVyO1xufVxuXG5mdW5jdGlvbiBhcHBseVN0eWxlKCkge1xuXHQvLyBTdXBwb3J0IHZhcmFncywgYnV0IHNpbXBseSBjYXN0IHRvIHN0cmluZyBpbiBjYXNlIHRoZXJlJ3Mgb25seSBvbmUgYXJnXG5cdGNvbnN0IGFyZ3MgPSBhcmd1bWVudHM7XG5cdGNvbnN0IGFyZ3NMZW4gPSBhcmdzLmxlbmd0aDtcblx0bGV0IHN0ciA9IFN0cmluZyhhcmd1bWVudHNbMF0pO1xuXG5cdGlmIChhcmdzTGVuID09PSAwKSB7XG5cdFx0cmV0dXJuICcnO1xuXHR9XG5cblx0aWYgKGFyZ3NMZW4gPiAxKSB7XG5cdFx0Ly8gRG9uJ3Qgc2xpY2UgYGFyZ3VtZW50c2AsIGl0IHByZXZlbnRzIFY4IG9wdGltaXphdGlvbnNcblx0XHRmb3IgKGxldCBhID0gMTsgYSA8IGFyZ3NMZW47IGErKykge1xuXHRcdFx0c3RyICs9ICcgJyArIGFyZ3NbYV07XG5cdFx0fVxuXHR9XG5cblx0aWYgKCF0aGlzLmVuYWJsZWQgfHwgdGhpcy5sZXZlbCA8PSAwIHx8ICFzdHIpIHtcblx0XHRyZXR1cm4gdGhpcy5fZW1wdHkgPyAnJyA6IHN0cjtcblx0fVxuXG5cdC8vIFR1cm5zIG91dCB0aGF0IG9uIFdpbmRvd3MgZGltbWVkIGdyYXkgdGV4dCBiZWNvbWVzIGludmlzaWJsZSBpbiBjbWQuZXhlLFxuXHQvLyBzZWUgaHR0cHM6Ly9naXRodWIuY29tL2NoYWxrL2NoYWxrL2lzc3Vlcy81OFxuXHQvLyBJZiB3ZSdyZSBvbiBXaW5kb3dzIGFuZCB3ZSdyZSBkZWFsaW5nIHdpdGggYSBncmF5IGNvbG9yLCB0ZW1wb3JhcmlseSBtYWtlICdkaW0nIGEgbm9vcC5cblx0Y29uc3Qgb3JpZ2luYWxEaW0gPSBhbnNpU3R5bGVzLmRpbS5vcGVuO1xuXHRpZiAoaXNTaW1wbGVXaW5kb3dzVGVybSAmJiB0aGlzLmhhc0dyZXkpIHtcblx0XHRhbnNpU3R5bGVzLmRpbS5vcGVuID0gJyc7XG5cdH1cblxuXHRmb3IgKGNvbnN0IGNvZGUgb2YgdGhpcy5fc3R5bGVzLnNsaWNlKCkucmV2ZXJzZSgpKSB7XG5cdFx0Ly8gUmVwbGFjZSBhbnkgaW5zdGFuY2VzIGFscmVhZHkgcHJlc2VudCB3aXRoIGEgcmUtb3BlbmluZyBjb2RlXG5cdFx0Ly8gb3RoZXJ3aXNlIG9ubHkgdGhlIHBhcnQgb2YgdGhlIHN0cmluZyB1bnRpbCBzYWlkIGNsb3NpbmcgY29kZVxuXHRcdC8vIHdpbGwgYmUgY29sb3JlZCwgYW5kIHRoZSByZXN0IHdpbGwgc2ltcGx5IGJlICdwbGFpbicuXG5cdFx0c3RyID0gY29kZS5vcGVuICsgc3RyLnJlcGxhY2UoY29kZS5jbG9zZVJlLCBjb2RlLm9wZW4pICsgY29kZS5jbG9zZTtcblxuXHRcdC8vIENsb3NlIHRoZSBzdHlsaW5nIGJlZm9yZSBhIGxpbmVicmVhayBhbmQgcmVvcGVuXG5cdFx0Ly8gYWZ0ZXIgbmV4dCBsaW5lIHRvIGZpeCBhIGJsZWVkIGlzc3VlIG9uIG1hY09TXG5cdFx0Ly8gaHR0cHM6Ly9naXRodWIuY29tL2NoYWxrL2NoYWxrL3B1bGwvOTJcblx0XHRzdHIgPSBzdHIucmVwbGFjZSgvXFxyP1xcbi9nLCBgJHtjb2RlLmNsb3NlfSQmJHtjb2RlLm9wZW59YCk7XG5cdH1cblxuXHQvLyBSZXNldCB0aGUgb3JpZ2luYWwgYGRpbWAgaWYgd2UgY2hhbmdlZCBpdCB0byB3b3JrIGFyb3VuZCB0aGUgV2luZG93cyBkaW1tZWQgZ3JheSBpc3N1ZVxuXHRhbnNpU3R5bGVzLmRpbS5vcGVuID0gb3JpZ2luYWxEaW07XG5cblx0cmV0dXJuIHN0cjtcbn1cblxuZnVuY3Rpb24gY2hhbGtUYWcoY2hhbGssIHN0cmluZ3MpIHtcblx0aWYgKCFBcnJheS5pc0FycmF5KHN0cmluZ3MpKSB7XG5cdFx0Ly8gSWYgY2hhbGsoKSB3YXMgY2FsbGVkIGJ5IGl0c2VsZiBvciB3aXRoIGEgc3RyaW5nLFxuXHRcdC8vIHJldHVybiB0aGUgc3RyaW5nIGl0c2VsZiBhcyBhIHN0cmluZy5cblx0XHRyZXR1cm4gW10uc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpLmpvaW4oJyAnKTtcblx0fVxuXG5cdGNvbnN0IGFyZ3MgPSBbXS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMik7XG5cdGNvbnN0IHBhcnRzID0gW3N0cmluZ3MucmF3WzBdXTtcblxuXHRmb3IgKGxldCBpID0gMTsgaSA8IHN0cmluZ3MubGVuZ3RoOyBpKyspIHtcblx0XHRwYXJ0cy5wdXNoKFN0cmluZyhhcmdzW2kgLSAxXSkucmVwbGFjZSgvW3t9XFxcXF0vZywgJ1xcXFwkJicpKTtcblx0XHRwYXJ0cy5wdXNoKFN0cmluZyhzdHJpbmdzLnJhd1tpXSkpO1xuXHR9XG5cblx0cmV0dXJuIHRlbXBsYXRlKGNoYWxrLCBwYXJ0cy5qb2luKCcnKSk7XG59XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0aWVzKENoYWxrLnByb3RvdHlwZSwgc3R5bGVzKTtcblxubW9kdWxlLmV4cG9ydHMgPSBDaGFsaygpOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5ldy1jYXBcbm1vZHVsZS5leHBvcnRzLnN1cHBvcnRzQ29sb3IgPSBzdGRvdXRDb2xvcjtcbm1vZHVsZS5leHBvcnRzLmRlZmF1bHQgPSBtb2R1bGUuZXhwb3J0czsgLy8gRm9yIFR5cGVTY3JpcHRcbiIsIid1c2Ugc3RyaWN0JztcbmNvbnN0IFRFTVBMQVRFX1JFR0VYID0gLyg/OlxcXFwodVthLWZcXGRdezR9fHhbYS1mXFxkXXsyfXwuKSl8KD86XFx7KH4pPyhcXHcrKD86XFwoW14pXSpcXCkpPyg/OlxcLlxcdysoPzpcXChbXildKlxcKSk/KSopKD86WyBcXHRdfCg/PVxccj9cXG4pKSl8KFxcfSl8KCg/Oi58W1xcclxcblxcZl0pKz8pL2dpO1xuY29uc3QgU1RZTEVfUkVHRVggPSAvKD86XnxcXC4pKFxcdyspKD86XFwoKFteKV0qKVxcKSk/L2c7XG5jb25zdCBTVFJJTkdfUkVHRVggPSAvXihbJ1wiXSkoKD86XFxcXC58KD8hXFwxKVteXFxcXF0pKilcXDEkLztcbmNvbnN0IEVTQ0FQRV9SRUdFWCA9IC9cXFxcKHVbYS1mXFxkXXs0fXx4W2EtZlxcZF17Mn18Lil8KFteXFxcXF0pL2dpO1xuXG5jb25zdCBFU0NBUEVTID0gbmV3IE1hcChbXG5cdFsnbicsICdcXG4nXSxcblx0WydyJywgJ1xcciddLFxuXHRbJ3QnLCAnXFx0J10sXG5cdFsnYicsICdcXGInXSxcblx0WydmJywgJ1xcZiddLFxuXHRbJ3YnLCAnXFx2J10sXG5cdFsnMCcsICdcXDAnXSxcblx0WydcXFxcJywgJ1xcXFwnXSxcblx0WydlJywgJ1xcdTAwMUInXSxcblx0WydhJywgJ1xcdTAwMDcnXVxuXSk7XG5cbmZ1bmN0aW9uIHVuZXNjYXBlKGMpIHtcblx0aWYgKChjWzBdID09PSAndScgJiYgYy5sZW5ndGggPT09IDUpIHx8IChjWzBdID09PSAneCcgJiYgYy5sZW5ndGggPT09IDMpKSB7XG5cdFx0cmV0dXJuIFN0cmluZy5mcm9tQ2hhckNvZGUocGFyc2VJbnQoYy5zbGljZSgxKSwgMTYpKTtcblx0fVxuXG5cdHJldHVybiBFU0NBUEVTLmdldChjKSB8fCBjO1xufVxuXG5mdW5jdGlvbiBwYXJzZUFyZ3VtZW50cyhuYW1lLCBhcmdzKSB7XG5cdGNvbnN0IHJlc3VsdHMgPSBbXTtcblx0Y29uc3QgY2h1bmtzID0gYXJncy50cmltKCkuc3BsaXQoL1xccyosXFxzKi9nKTtcblx0bGV0IG1hdGNoZXM7XG5cblx0Zm9yIChjb25zdCBjaHVuayBvZiBjaHVua3MpIHtcblx0XHRpZiAoIWlzTmFOKGNodW5rKSkge1xuXHRcdFx0cmVzdWx0cy5wdXNoKE51bWJlcihjaHVuaykpO1xuXHRcdH0gZWxzZSBpZiAoKG1hdGNoZXMgPSBjaHVuay5tYXRjaChTVFJJTkdfUkVHRVgpKSkge1xuXHRcdFx0cmVzdWx0cy5wdXNoKG1hdGNoZXNbMl0ucmVwbGFjZShFU0NBUEVfUkVHRVgsIChtLCBlc2NhcGUsIGNocikgPT4gZXNjYXBlID8gdW5lc2NhcGUoZXNjYXBlKSA6IGNocikpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoYEludmFsaWQgQ2hhbGsgdGVtcGxhdGUgc3R5bGUgYXJndW1lbnQ6ICR7Y2h1bmt9IChpbiBzdHlsZSAnJHtuYW1lfScpYCk7XG5cdFx0fVxuXHR9XG5cblx0cmV0dXJuIHJlc3VsdHM7XG59XG5cbmZ1bmN0aW9uIHBhcnNlU3R5bGUoc3R5bGUpIHtcblx0U1RZTEVfUkVHRVgubGFzdEluZGV4ID0gMDtcblxuXHRjb25zdCByZXN1bHRzID0gW107XG5cdGxldCBtYXRjaGVzO1xuXG5cdHdoaWxlICgobWF0Y2hlcyA9IFNUWUxFX1JFR0VYLmV4ZWMoc3R5bGUpKSAhPT0gbnVsbCkge1xuXHRcdGNvbnN0IG5hbWUgPSBtYXRjaGVzWzFdO1xuXG5cdFx0aWYgKG1hdGNoZXNbMl0pIHtcblx0XHRcdGNvbnN0IGFyZ3MgPSBwYXJzZUFyZ3VtZW50cyhuYW1lLCBtYXRjaGVzWzJdKTtcblx0XHRcdHJlc3VsdHMucHVzaChbbmFtZV0uY29uY2F0KGFyZ3MpKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0cmVzdWx0cy5wdXNoKFtuYW1lXSk7XG5cdFx0fVxuXHR9XG5cblx0cmV0dXJuIHJlc3VsdHM7XG59XG5cbmZ1bmN0aW9uIGJ1aWxkU3R5bGUoY2hhbGssIHN0eWxlcykge1xuXHRjb25zdCBlbmFibGVkID0ge307XG5cblx0Zm9yIChjb25zdCBsYXllciBvZiBzdHlsZXMpIHtcblx0XHRmb3IgKGNvbnN0IHN0eWxlIG9mIGxheWVyLnN0eWxlcykge1xuXHRcdFx0ZW5hYmxlZFtzdHlsZVswXV0gPSBsYXllci5pbnZlcnNlID8gbnVsbCA6IHN0eWxlLnNsaWNlKDEpO1xuXHRcdH1cblx0fVxuXG5cdGxldCBjdXJyZW50ID0gY2hhbGs7XG5cdGZvciAoY29uc3Qgc3R5bGVOYW1lIG9mIE9iamVjdC5rZXlzKGVuYWJsZWQpKSB7XG5cdFx0aWYgKEFycmF5LmlzQXJyYXkoZW5hYmxlZFtzdHlsZU5hbWVdKSkge1xuXHRcdFx0aWYgKCEoc3R5bGVOYW1lIGluIGN1cnJlbnQpKSB7XG5cdFx0XHRcdHRocm93IG5ldyBFcnJvcihgVW5rbm93biBDaGFsayBzdHlsZTogJHtzdHlsZU5hbWV9YCk7XG5cdFx0XHR9XG5cblx0XHRcdGlmIChlbmFibGVkW3N0eWxlTmFtZV0ubGVuZ3RoID4gMCkge1xuXHRcdFx0XHRjdXJyZW50ID0gY3VycmVudFtzdHlsZU5hbWVdLmFwcGx5KGN1cnJlbnQsIGVuYWJsZWRbc3R5bGVOYW1lXSk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRjdXJyZW50ID0gY3VycmVudFtzdHlsZU5hbWVdO1xuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG5cdHJldHVybiBjdXJyZW50O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IChjaGFsaywgdG1wKSA9PiB7XG5cdGNvbnN0IHN0eWxlcyA9IFtdO1xuXHRjb25zdCBjaHVua3MgPSBbXTtcblx0bGV0IGNodW5rID0gW107XG5cblx0Ly8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG1heC1wYXJhbXNcblx0dG1wLnJlcGxhY2UoVEVNUExBVEVfUkVHRVgsIChtLCBlc2NhcGVDaGFyLCBpbnZlcnNlLCBzdHlsZSwgY2xvc2UsIGNocikgPT4ge1xuXHRcdGlmIChlc2NhcGVDaGFyKSB7XG5cdFx0XHRjaHVuay5wdXNoKHVuZXNjYXBlKGVzY2FwZUNoYXIpKTtcblx0XHR9IGVsc2UgaWYgKHN0eWxlKSB7XG5cdFx0XHRjb25zdCBzdHIgPSBjaHVuay5qb2luKCcnKTtcblx0XHRcdGNodW5rID0gW107XG5cdFx0XHRjaHVua3MucHVzaChzdHlsZXMubGVuZ3RoID09PSAwID8gc3RyIDogYnVpbGRTdHlsZShjaGFsaywgc3R5bGVzKShzdHIpKTtcblx0XHRcdHN0eWxlcy5wdXNoKHtpbnZlcnNlLCBzdHlsZXM6IHBhcnNlU3R5bGUoc3R5bGUpfSk7XG5cdFx0fSBlbHNlIGlmIChjbG9zZSkge1xuXHRcdFx0aWYgKHN0eWxlcy5sZW5ndGggPT09IDApIHtcblx0XHRcdFx0dGhyb3cgbmV3IEVycm9yKCdGb3VuZCBleHRyYW5lb3VzIH0gaW4gQ2hhbGsgdGVtcGxhdGUgbGl0ZXJhbCcpO1xuXHRcdFx0fVxuXG5cdFx0XHRjaHVua3MucHVzaChidWlsZFN0eWxlKGNoYWxrLCBzdHlsZXMpKGNodW5rLmpvaW4oJycpKSk7XG5cdFx0XHRjaHVuayA9IFtdO1xuXHRcdFx0c3R5bGVzLnBvcCgpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRjaHVuay5wdXNoKGNocik7XG5cdFx0fVxuXHR9KTtcblxuXHRjaHVua3MucHVzaChjaHVuay5qb2luKCcnKSk7XG5cblx0aWYgKHN0eWxlcy5sZW5ndGggPiAwKSB7XG5cdFx0Y29uc3QgZXJyTXNnID0gYENoYWxrIHRlbXBsYXRlIGxpdGVyYWwgaXMgbWlzc2luZyAke3N0eWxlcy5sZW5ndGh9IGNsb3NpbmcgYnJhY2tldCR7c3R5bGVzLmxlbmd0aCA9PT0gMSA/ICcnIDogJ3MnfSAoXFxgfVxcYClgO1xuXHRcdHRocm93IG5ldyBFcnJvcihlcnJNc2cpO1xuXHR9XG5cblx0cmV0dXJuIGNodW5rcy5qb2luKCcnKTtcbn07XG4iLCIndXNlIHN0cmljdCc7XG5tb2R1bGUuZXhwb3J0cyA9IChmbGFnLCBhcmd2KSA9PiB7XG5cdGFyZ3YgPSBhcmd2IHx8IHByb2Nlc3MuYXJndjtcblx0Y29uc3QgcHJlZml4ID0gZmxhZy5zdGFydHNXaXRoKCctJykgPyAnJyA6IChmbGFnLmxlbmd0aCA9PT0gMSA/ICctJyA6ICctLScpO1xuXHRjb25zdCBwb3MgPSBhcmd2LmluZGV4T2YocHJlZml4ICsgZmxhZyk7XG5cdGNvbnN0IHRlcm1pbmF0b3JQb3MgPSBhcmd2LmluZGV4T2YoJy0tJyk7XG5cdHJldHVybiBwb3MgIT09IC0xICYmICh0ZXJtaW5hdG9yUG9zID09PSAtMSA/IHRydWUgOiBwb3MgPCB0ZXJtaW5hdG9yUG9zKTtcbn07XG4iLCIndXNlIHN0cmljdCc7XG5jb25zdCBvcyA9IHJlcXVpcmUoJ29zJyk7XG5jb25zdCBoYXNGbGFnID0gcmVxdWlyZSgnaGFzLWZsYWcnKTtcblxuY29uc3QgZW52ID0gcHJvY2Vzcy5lbnY7XG5cbmxldCBmb3JjZUNvbG9yO1xuaWYgKGhhc0ZsYWcoJ25vLWNvbG9yJykgfHxcblx0aGFzRmxhZygnbm8tY29sb3JzJykgfHxcblx0aGFzRmxhZygnY29sb3I9ZmFsc2UnKSkge1xuXHRmb3JjZUNvbG9yID0gZmFsc2U7XG59IGVsc2UgaWYgKGhhc0ZsYWcoJ2NvbG9yJykgfHxcblx0aGFzRmxhZygnY29sb3JzJykgfHxcblx0aGFzRmxhZygnY29sb3I9dHJ1ZScpIHx8XG5cdGhhc0ZsYWcoJ2NvbG9yPWFsd2F5cycpKSB7XG5cdGZvcmNlQ29sb3IgPSB0cnVlO1xufVxuaWYgKCdGT1JDRV9DT0xPUicgaW4gZW52KSB7XG5cdGZvcmNlQ29sb3IgPSBlbnYuRk9SQ0VfQ09MT1IubGVuZ3RoID09PSAwIHx8IHBhcnNlSW50KGVudi5GT1JDRV9DT0xPUiwgMTApICE9PSAwO1xufVxuXG5mdW5jdGlvbiB0cmFuc2xhdGVMZXZlbChsZXZlbCkge1xuXHRpZiAobGV2ZWwgPT09IDApIHtcblx0XHRyZXR1cm4gZmFsc2U7XG5cdH1cblxuXHRyZXR1cm4ge1xuXHRcdGxldmVsLFxuXHRcdGhhc0Jhc2ljOiB0cnVlLFxuXHRcdGhhczI1NjogbGV2ZWwgPj0gMixcblx0XHRoYXMxNm06IGxldmVsID49IDNcblx0fTtcbn1cblxuZnVuY3Rpb24gc3VwcG9ydHNDb2xvcihzdHJlYW0pIHtcblx0aWYgKGZvcmNlQ29sb3IgPT09IGZhbHNlKSB7XG5cdFx0cmV0dXJuIDA7XG5cdH1cblxuXHRpZiAoaGFzRmxhZygnY29sb3I9MTZtJykgfHxcblx0XHRoYXNGbGFnKCdjb2xvcj1mdWxsJykgfHxcblx0XHRoYXNGbGFnKCdjb2xvcj10cnVlY29sb3InKSkge1xuXHRcdHJldHVybiAzO1xuXHR9XG5cblx0aWYgKGhhc0ZsYWcoJ2NvbG9yPTI1NicpKSB7XG5cdFx0cmV0dXJuIDI7XG5cdH1cblxuXHRpZiAoc3RyZWFtICYmICFzdHJlYW0uaXNUVFkgJiYgZm9yY2VDb2xvciAhPT0gdHJ1ZSkge1xuXHRcdHJldHVybiAwO1xuXHR9XG5cblx0Y29uc3QgbWluID0gZm9yY2VDb2xvciA/IDEgOiAwO1xuXG5cdGlmIChwcm9jZXNzLnBsYXRmb3JtID09PSAnd2luMzInKSB7XG5cdFx0Ly8gTm9kZS5qcyA3LjUuMCBpcyB0aGUgZmlyc3QgdmVyc2lvbiBvZiBOb2RlLmpzIHRvIGluY2x1ZGUgYSBwYXRjaCB0b1xuXHRcdC8vIGxpYnV2IHRoYXQgZW5hYmxlcyAyNTYgY29sb3Igb3V0cHV0IG9uIFdpbmRvd3MuIEFueXRoaW5nIGVhcmxpZXIgYW5kIGl0XG5cdFx0Ly8gd29uJ3Qgd29yay4gSG93ZXZlciwgaGVyZSB3ZSB0YXJnZXQgTm9kZS5qcyA4IGF0IG1pbmltdW0gYXMgaXQgaXMgYW4gTFRTXG5cdFx0Ly8gcmVsZWFzZSwgYW5kIE5vZGUuanMgNyBpcyBub3QuIFdpbmRvd3MgMTAgYnVpbGQgMTA1ODYgaXMgdGhlIGZpcnN0IFdpbmRvd3Ncblx0XHQvLyByZWxlYXNlIHRoYXQgc3VwcG9ydHMgMjU2IGNvbG9ycy4gV2luZG93cyAxMCBidWlsZCAxNDkzMSBpcyB0aGUgZmlyc3QgcmVsZWFzZVxuXHRcdC8vIHRoYXQgc3VwcG9ydHMgMTZtL1RydWVDb2xvci5cblx0XHRjb25zdCBvc1JlbGVhc2UgPSBvcy5yZWxlYXNlKCkuc3BsaXQoJy4nKTtcblx0XHRpZiAoXG5cdFx0XHROdW1iZXIocHJvY2Vzcy52ZXJzaW9ucy5ub2RlLnNwbGl0KCcuJylbMF0pID49IDggJiZcblx0XHRcdE51bWJlcihvc1JlbGVhc2VbMF0pID49IDEwICYmXG5cdFx0XHROdW1iZXIob3NSZWxlYXNlWzJdKSA+PSAxMDU4NlxuXHRcdCkge1xuXHRcdFx0cmV0dXJuIE51bWJlcihvc1JlbGVhc2VbMl0pID49IDE0OTMxID8gMyA6IDI7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIDE7XG5cdH1cblxuXHRpZiAoJ0NJJyBpbiBlbnYpIHtcblx0XHRpZiAoWydUUkFWSVMnLCAnQ0lSQ0xFQ0knLCAnQVBQVkVZT1InLCAnR0lUTEFCX0NJJ10uc29tZShzaWduID0+IHNpZ24gaW4gZW52KSB8fCBlbnYuQ0lfTkFNRSA9PT0gJ2NvZGVzaGlwJykge1xuXHRcdFx0cmV0dXJuIDE7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIG1pbjtcblx0fVxuXG5cdGlmICgnVEVBTUNJVFlfVkVSU0lPTicgaW4gZW52KSB7XG5cdFx0cmV0dXJuIC9eKDlcXC4oMCpbMS05XVxcZCopXFwufFxcZHsyLH1cXC4pLy50ZXN0KGVudi5URUFNQ0lUWV9WRVJTSU9OKSA/IDEgOiAwO1xuXHR9XG5cblx0aWYgKGVudi5DT0xPUlRFUk0gPT09ICd0cnVlY29sb3InKSB7XG5cdFx0cmV0dXJuIDM7XG5cdH1cblxuXHRpZiAoJ1RFUk1fUFJPR1JBTScgaW4gZW52KSB7XG5cdFx0Y29uc3QgdmVyc2lvbiA9IHBhcnNlSW50KChlbnYuVEVSTV9QUk9HUkFNX1ZFUlNJT04gfHwgJycpLnNwbGl0KCcuJylbMF0sIDEwKTtcblxuXHRcdHN3aXRjaCAoZW52LlRFUk1fUFJPR1JBTSkge1xuXHRcdFx0Y2FzZSAnaVRlcm0uYXBwJzpcblx0XHRcdFx0cmV0dXJuIHZlcnNpb24gPj0gMyA/IDMgOiAyO1xuXHRcdFx0Y2FzZSAnQXBwbGVfVGVybWluYWwnOlxuXHRcdFx0XHRyZXR1cm4gMjtcblx0XHRcdC8vIE5vIGRlZmF1bHRcblx0XHR9XG5cdH1cblxuXHRpZiAoLy0yNTYoY29sb3IpPyQvaS50ZXN0KGVudi5URVJNKSkge1xuXHRcdHJldHVybiAyO1xuXHR9XG5cblx0aWYgKC9ec2NyZWVufF54dGVybXxednQxMDB8XnZ0MjIwfF5yeHZ0fGNvbG9yfGFuc2l8Y3lnd2lufGxpbnV4L2kudGVzdChlbnYuVEVSTSkpIHtcblx0XHRyZXR1cm4gMTtcblx0fVxuXG5cdGlmICgnQ09MT1JURVJNJyBpbiBlbnYpIHtcblx0XHRyZXR1cm4gMTtcblx0fVxuXG5cdGlmIChlbnYuVEVSTSA9PT0gJ2R1bWInKSB7XG5cdFx0cmV0dXJuIG1pbjtcblx0fVxuXG5cdHJldHVybiBtaW47XG59XG5cbmZ1bmN0aW9uIGdldFN1cHBvcnRMZXZlbChzdHJlYW0pIHtcblx0Y29uc3QgbGV2ZWwgPSBzdXBwb3J0c0NvbG9yKHN0cmVhbSk7XG5cdHJldHVybiB0cmFuc2xhdGVMZXZlbChsZXZlbCk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuXHRzdXBwb3J0c0NvbG9yOiBnZXRTdXBwb3J0TGV2ZWwsXG5cdHN0ZG91dDogZ2V0U3VwcG9ydExldmVsKHByb2Nlc3Muc3Rkb3V0KSxcblx0c3RkZXJyOiBnZXRTdXBwb3J0TGV2ZWwocHJvY2Vzcy5zdGRlcnIpXG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5jb25zdCBwcmVzZXJ2ZUNhbWVsQ2FzZSA9IGlucHV0ID0+IHtcblx0bGV0IGlzTGFzdENoYXJMb3dlciA9IGZhbHNlO1xuXHRsZXQgaXNMYXN0Q2hhclVwcGVyID0gZmFsc2U7XG5cdGxldCBpc0xhc3RMYXN0Q2hhclVwcGVyID0gZmFsc2U7XG5cblx0Zm9yIChsZXQgaSA9IDA7IGkgPCBpbnB1dC5sZW5ndGg7IGkrKykge1xuXHRcdGNvbnN0IGMgPSBpbnB1dFtpXTtcblxuXHRcdGlmIChpc0xhc3RDaGFyTG93ZXIgJiYgL1thLXpBLVpdLy50ZXN0KGMpICYmIGMudG9VcHBlckNhc2UoKSA9PT0gYykge1xuXHRcdFx0aW5wdXQgPSBpbnB1dC5zbGljZSgwLCBpKSArICctJyArIGlucHV0LnNsaWNlKGkpO1xuXHRcdFx0aXNMYXN0Q2hhckxvd2VyID0gZmFsc2U7XG5cdFx0XHRpc0xhc3RMYXN0Q2hhclVwcGVyID0gaXNMYXN0Q2hhclVwcGVyO1xuXHRcdFx0aXNMYXN0Q2hhclVwcGVyID0gdHJ1ZTtcblx0XHRcdGkrKztcblx0XHR9IGVsc2UgaWYgKGlzTGFzdENoYXJVcHBlciAmJiBpc0xhc3RMYXN0Q2hhclVwcGVyICYmIC9bYS16QS1aXS8udGVzdChjKSAmJiBjLnRvTG93ZXJDYXNlKCkgPT09IGMpIHtcblx0XHRcdGlucHV0ID0gaW5wdXQuc2xpY2UoMCwgaSAtIDEpICsgJy0nICsgaW5wdXQuc2xpY2UoaSAtIDEpO1xuXHRcdFx0aXNMYXN0TGFzdENoYXJVcHBlciA9IGlzTGFzdENoYXJVcHBlcjtcblx0XHRcdGlzTGFzdENoYXJVcHBlciA9IGZhbHNlO1xuXHRcdFx0aXNMYXN0Q2hhckxvd2VyID0gdHJ1ZTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0aXNMYXN0Q2hhckxvd2VyID0gYy50b0xvd2VyQ2FzZSgpID09PSBjO1xuXHRcdFx0aXNMYXN0TGFzdENoYXJVcHBlciA9IGlzTGFzdENoYXJVcHBlcjtcblx0XHRcdGlzTGFzdENoYXJVcHBlciA9IGMudG9VcHBlckNhc2UoKSA9PT0gYztcblx0XHR9XG5cdH1cblxuXHRyZXR1cm4gaW5wdXQ7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IChpbnB1dCwgb3B0aW9ucykgPT4ge1xuXHRvcHRpb25zID0gT2JqZWN0LmFzc2lnbih7XG5cdFx0cGFzY2FsQ2FzZTogZmFsc2Vcblx0fSwgb3B0aW9ucyk7XG5cblx0Y29uc3QgcG9zdFByb2Nlc3MgPSB4ID0+IG9wdGlvbnMucGFzY2FsQ2FzZSA/IHguY2hhckF0KDApLnRvVXBwZXJDYXNlKCkgKyB4LnNsaWNlKDEpIDogeDtcblxuXHRpZiAoQXJyYXkuaXNBcnJheShpbnB1dCkpIHtcblx0XHRpbnB1dCA9IGlucHV0Lm1hcCh4ID0+IHgudHJpbSgpKVxuXHRcdFx0LmZpbHRlcih4ID0+IHgubGVuZ3RoKVxuXHRcdFx0LmpvaW4oJy0nKTtcblx0fSBlbHNlIHtcblx0XHRpbnB1dCA9IGlucHV0LnRyaW0oKTtcblx0fVxuXG5cdGlmIChpbnB1dC5sZW5ndGggPT09IDApIHtcblx0XHRyZXR1cm4gJyc7XG5cdH1cblxuXHRpZiAoaW5wdXQubGVuZ3RoID09PSAxKSB7XG5cdFx0cmV0dXJuIG9wdGlvbnMucGFzY2FsQ2FzZSA/IGlucHV0LnRvVXBwZXJDYXNlKCkgOiBpbnB1dC50b0xvd2VyQ2FzZSgpO1xuXHR9XG5cblx0aWYgKC9eW2EtelxcZF0rJC8udGVzdChpbnB1dCkpIHtcblx0XHRyZXR1cm4gcG9zdFByb2Nlc3MoaW5wdXQpO1xuXHR9XG5cblx0Y29uc3QgaGFzVXBwZXJDYXNlID0gaW5wdXQgIT09IGlucHV0LnRvTG93ZXJDYXNlKCk7XG5cblx0aWYgKGhhc1VwcGVyQ2FzZSkge1xuXHRcdGlucHV0ID0gcHJlc2VydmVDYW1lbENhc2UoaW5wdXQpO1xuXHR9XG5cblx0aW5wdXQgPSBpbnB1dFxuXHRcdC5yZXBsYWNlKC9eW18uXFwtIF0rLywgJycpXG5cdFx0LnRvTG93ZXJDYXNlKClcblx0XHQucmVwbGFjZSgvW18uXFwtIF0rKFxcd3wkKS9nLCAobSwgcDEpID0+IHAxLnRvVXBwZXJDYXNlKCkpO1xuXG5cdHJldHVybiBwb3N0UHJvY2VzcyhpbnB1dCk7XG59O1xuIiwiLyogTUlUIGxpY2Vuc2UgKi9cbnZhciBjc3NLZXl3b3JkcyA9IHJlcXVpcmUoJ2NvbG9yLW5hbWUnKTtcblxuLy8gTk9URTogY29udmVyc2lvbnMgc2hvdWxkIG9ubHkgcmV0dXJuIHByaW1pdGl2ZSB2YWx1ZXMgKGkuZS4gYXJyYXlzLCBvclxuLy8gICAgICAgdmFsdWVzIHRoYXQgZ2l2ZSBjb3JyZWN0IGB0eXBlb2ZgIHJlc3VsdHMpLlxuLy8gICAgICAgZG8gbm90IHVzZSBib3ggdmFsdWVzIHR5cGVzIChpLmUuIE51bWJlcigpLCBTdHJpbmcoKSwgZXRjLilcblxudmFyIHJldmVyc2VLZXl3b3JkcyA9IHt9O1xuZm9yICh2YXIga2V5IGluIGNzc0tleXdvcmRzKSB7XG5cdGlmIChjc3NLZXl3b3Jkcy5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG5cdFx0cmV2ZXJzZUtleXdvcmRzW2Nzc0tleXdvcmRzW2tleV1dID0ga2V5O1xuXHR9XG59XG5cbnZhciBjb252ZXJ0ID0gbW9kdWxlLmV4cG9ydHMgPSB7XG5cdHJnYjoge2NoYW5uZWxzOiAzLCBsYWJlbHM6ICdyZ2InfSxcblx0aHNsOiB7Y2hhbm5lbHM6IDMsIGxhYmVsczogJ2hzbCd9LFxuXHRoc3Y6IHtjaGFubmVsczogMywgbGFiZWxzOiAnaHN2J30sXG5cdGh3Yjoge2NoYW5uZWxzOiAzLCBsYWJlbHM6ICdod2InfSxcblx0Y215azoge2NoYW5uZWxzOiA0LCBsYWJlbHM6ICdjbXlrJ30sXG5cdHh5ejoge2NoYW5uZWxzOiAzLCBsYWJlbHM6ICd4eXonfSxcblx0bGFiOiB7Y2hhbm5lbHM6IDMsIGxhYmVsczogJ2xhYid9LFxuXHRsY2g6IHtjaGFubmVsczogMywgbGFiZWxzOiAnbGNoJ30sXG5cdGhleDoge2NoYW5uZWxzOiAxLCBsYWJlbHM6IFsnaGV4J119LFxuXHRrZXl3b3JkOiB7Y2hhbm5lbHM6IDEsIGxhYmVsczogWydrZXl3b3JkJ119LFxuXHRhbnNpMTY6IHtjaGFubmVsczogMSwgbGFiZWxzOiBbJ2Fuc2kxNiddfSxcblx0YW5zaTI1Njoge2NoYW5uZWxzOiAxLCBsYWJlbHM6IFsnYW5zaTI1NiddfSxcblx0aGNnOiB7Y2hhbm5lbHM6IDMsIGxhYmVsczogWydoJywgJ2MnLCAnZyddfSxcblx0YXBwbGU6IHtjaGFubmVsczogMywgbGFiZWxzOiBbJ3IxNicsICdnMTYnLCAnYjE2J119LFxuXHRncmF5OiB7Y2hhbm5lbHM6IDEsIGxhYmVsczogWydncmF5J119XG59O1xuXG4vLyBoaWRlIC5jaGFubmVscyBhbmQgLmxhYmVscyBwcm9wZXJ0aWVzXG5mb3IgKHZhciBtb2RlbCBpbiBjb252ZXJ0KSB7XG5cdGlmIChjb252ZXJ0Lmhhc093blByb3BlcnR5KG1vZGVsKSkge1xuXHRcdGlmICghKCdjaGFubmVscycgaW4gY29udmVydFttb2RlbF0pKSB7XG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoJ21pc3NpbmcgY2hhbm5lbHMgcHJvcGVydHk6ICcgKyBtb2RlbCk7XG5cdFx0fVxuXG5cdFx0aWYgKCEoJ2xhYmVscycgaW4gY29udmVydFttb2RlbF0pKSB7XG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoJ21pc3NpbmcgY2hhbm5lbCBsYWJlbHMgcHJvcGVydHk6ICcgKyBtb2RlbCk7XG5cdFx0fVxuXG5cdFx0aWYgKGNvbnZlcnRbbW9kZWxdLmxhYmVscy5sZW5ndGggIT09IGNvbnZlcnRbbW9kZWxdLmNoYW5uZWxzKSB7XG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoJ2NoYW5uZWwgYW5kIGxhYmVsIGNvdW50cyBtaXNtYXRjaDogJyArIG1vZGVsKTtcblx0XHR9XG5cblx0XHR2YXIgY2hhbm5lbHMgPSBjb252ZXJ0W21vZGVsXS5jaGFubmVscztcblx0XHR2YXIgbGFiZWxzID0gY29udmVydFttb2RlbF0ubGFiZWxzO1xuXHRcdGRlbGV0ZSBjb252ZXJ0W21vZGVsXS5jaGFubmVscztcblx0XHRkZWxldGUgY29udmVydFttb2RlbF0ubGFiZWxzO1xuXHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShjb252ZXJ0W21vZGVsXSwgJ2NoYW5uZWxzJywge3ZhbHVlOiBjaGFubmVsc30pO1xuXHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShjb252ZXJ0W21vZGVsXSwgJ2xhYmVscycsIHt2YWx1ZTogbGFiZWxzfSk7XG5cdH1cbn1cblxuY29udmVydC5yZ2IuaHNsID0gZnVuY3Rpb24gKHJnYikge1xuXHR2YXIgciA9IHJnYlswXSAvIDI1NTtcblx0dmFyIGcgPSByZ2JbMV0gLyAyNTU7XG5cdHZhciBiID0gcmdiWzJdIC8gMjU1O1xuXHR2YXIgbWluID0gTWF0aC5taW4ociwgZywgYik7XG5cdHZhciBtYXggPSBNYXRoLm1heChyLCBnLCBiKTtcblx0dmFyIGRlbHRhID0gbWF4IC0gbWluO1xuXHR2YXIgaDtcblx0dmFyIHM7XG5cdHZhciBsO1xuXG5cdGlmIChtYXggPT09IG1pbikge1xuXHRcdGggPSAwO1xuXHR9IGVsc2UgaWYgKHIgPT09IG1heCkge1xuXHRcdGggPSAoZyAtIGIpIC8gZGVsdGE7XG5cdH0gZWxzZSBpZiAoZyA9PT0gbWF4KSB7XG5cdFx0aCA9IDIgKyAoYiAtIHIpIC8gZGVsdGE7XG5cdH0gZWxzZSBpZiAoYiA9PT0gbWF4KSB7XG5cdFx0aCA9IDQgKyAociAtIGcpIC8gZGVsdGE7XG5cdH1cblxuXHRoID0gTWF0aC5taW4oaCAqIDYwLCAzNjApO1xuXG5cdGlmIChoIDwgMCkge1xuXHRcdGggKz0gMzYwO1xuXHR9XG5cblx0bCA9IChtaW4gKyBtYXgpIC8gMjtcblxuXHRpZiAobWF4ID09PSBtaW4pIHtcblx0XHRzID0gMDtcblx0fSBlbHNlIGlmIChsIDw9IDAuNSkge1xuXHRcdHMgPSBkZWx0YSAvIChtYXggKyBtaW4pO1xuXHR9IGVsc2Uge1xuXHRcdHMgPSBkZWx0YSAvICgyIC0gbWF4IC0gbWluKTtcblx0fVxuXG5cdHJldHVybiBbaCwgcyAqIDEwMCwgbCAqIDEwMF07XG59O1xuXG5jb252ZXJ0LnJnYi5oc3YgPSBmdW5jdGlvbiAocmdiKSB7XG5cdHZhciByZGlmO1xuXHR2YXIgZ2RpZjtcblx0dmFyIGJkaWY7XG5cdHZhciBoO1xuXHR2YXIgcztcblxuXHR2YXIgciA9IHJnYlswXSAvIDI1NTtcblx0dmFyIGcgPSByZ2JbMV0gLyAyNTU7XG5cdHZhciBiID0gcmdiWzJdIC8gMjU1O1xuXHR2YXIgdiA9IE1hdGgubWF4KHIsIGcsIGIpO1xuXHR2YXIgZGlmZiA9IHYgLSBNYXRoLm1pbihyLCBnLCBiKTtcblx0dmFyIGRpZmZjID0gZnVuY3Rpb24gKGMpIHtcblx0XHRyZXR1cm4gKHYgLSBjKSAvIDYgLyBkaWZmICsgMSAvIDI7XG5cdH07XG5cblx0aWYgKGRpZmYgPT09IDApIHtcblx0XHRoID0gcyA9IDA7XG5cdH0gZWxzZSB7XG5cdFx0cyA9IGRpZmYgLyB2O1xuXHRcdHJkaWYgPSBkaWZmYyhyKTtcblx0XHRnZGlmID0gZGlmZmMoZyk7XG5cdFx0YmRpZiA9IGRpZmZjKGIpO1xuXG5cdFx0aWYgKHIgPT09IHYpIHtcblx0XHRcdGggPSBiZGlmIC0gZ2RpZjtcblx0XHR9IGVsc2UgaWYgKGcgPT09IHYpIHtcblx0XHRcdGggPSAoMSAvIDMpICsgcmRpZiAtIGJkaWY7XG5cdFx0fSBlbHNlIGlmIChiID09PSB2KSB7XG5cdFx0XHRoID0gKDIgLyAzKSArIGdkaWYgLSByZGlmO1xuXHRcdH1cblx0XHRpZiAoaCA8IDApIHtcblx0XHRcdGggKz0gMTtcblx0XHR9IGVsc2UgaWYgKGggPiAxKSB7XG5cdFx0XHRoIC09IDE7XG5cdFx0fVxuXHR9XG5cblx0cmV0dXJuIFtcblx0XHRoICogMzYwLFxuXHRcdHMgKiAxMDAsXG5cdFx0diAqIDEwMFxuXHRdO1xufTtcblxuY29udmVydC5yZ2IuaHdiID0gZnVuY3Rpb24gKHJnYikge1xuXHR2YXIgciA9IHJnYlswXTtcblx0dmFyIGcgPSByZ2JbMV07XG5cdHZhciBiID0gcmdiWzJdO1xuXHR2YXIgaCA9IGNvbnZlcnQucmdiLmhzbChyZ2IpWzBdO1xuXHR2YXIgdyA9IDEgLyAyNTUgKiBNYXRoLm1pbihyLCBNYXRoLm1pbihnLCBiKSk7XG5cblx0YiA9IDEgLSAxIC8gMjU1ICogTWF0aC5tYXgociwgTWF0aC5tYXgoZywgYikpO1xuXG5cdHJldHVybiBbaCwgdyAqIDEwMCwgYiAqIDEwMF07XG59O1xuXG5jb252ZXJ0LnJnYi5jbXlrID0gZnVuY3Rpb24gKHJnYikge1xuXHR2YXIgciA9IHJnYlswXSAvIDI1NTtcblx0dmFyIGcgPSByZ2JbMV0gLyAyNTU7XG5cdHZhciBiID0gcmdiWzJdIC8gMjU1O1xuXHR2YXIgYztcblx0dmFyIG07XG5cdHZhciB5O1xuXHR2YXIgaztcblxuXHRrID0gTWF0aC5taW4oMSAtIHIsIDEgLSBnLCAxIC0gYik7XG5cdGMgPSAoMSAtIHIgLSBrKSAvICgxIC0gaykgfHwgMDtcblx0bSA9ICgxIC0gZyAtIGspIC8gKDEgLSBrKSB8fCAwO1xuXHR5ID0gKDEgLSBiIC0gaykgLyAoMSAtIGspIHx8IDA7XG5cblx0cmV0dXJuIFtjICogMTAwLCBtICogMTAwLCB5ICogMTAwLCBrICogMTAwXTtcbn07XG5cbi8qKlxuICogU2VlIGh0dHBzOi8vZW4ubS53aWtpcGVkaWEub3JnL3dpa2kvRXVjbGlkZWFuX2Rpc3RhbmNlI1NxdWFyZWRfRXVjbGlkZWFuX2Rpc3RhbmNlXG4gKiAqL1xuZnVuY3Rpb24gY29tcGFyYXRpdmVEaXN0YW5jZSh4LCB5KSB7XG5cdHJldHVybiAoXG5cdFx0TWF0aC5wb3coeFswXSAtIHlbMF0sIDIpICtcblx0XHRNYXRoLnBvdyh4WzFdIC0geVsxXSwgMikgK1xuXHRcdE1hdGgucG93KHhbMl0gLSB5WzJdLCAyKVxuXHQpO1xufVxuXG5jb252ZXJ0LnJnYi5rZXl3b3JkID0gZnVuY3Rpb24gKHJnYikge1xuXHR2YXIgcmV2ZXJzZWQgPSByZXZlcnNlS2V5d29yZHNbcmdiXTtcblx0aWYgKHJldmVyc2VkKSB7XG5cdFx0cmV0dXJuIHJldmVyc2VkO1xuXHR9XG5cblx0dmFyIGN1cnJlbnRDbG9zZXN0RGlzdGFuY2UgPSBJbmZpbml0eTtcblx0dmFyIGN1cnJlbnRDbG9zZXN0S2V5d29yZDtcblxuXHRmb3IgKHZhciBrZXl3b3JkIGluIGNzc0tleXdvcmRzKSB7XG5cdFx0aWYgKGNzc0tleXdvcmRzLmhhc093blByb3BlcnR5KGtleXdvcmQpKSB7XG5cdFx0XHR2YXIgdmFsdWUgPSBjc3NLZXl3b3Jkc1trZXl3b3JkXTtcblxuXHRcdFx0Ly8gQ29tcHV0ZSBjb21wYXJhdGl2ZSBkaXN0YW5jZVxuXHRcdFx0dmFyIGRpc3RhbmNlID0gY29tcGFyYXRpdmVEaXN0YW5jZShyZ2IsIHZhbHVlKTtcblxuXHRcdFx0Ly8gQ2hlY2sgaWYgaXRzIGxlc3MsIGlmIHNvIHNldCBhcyBjbG9zZXN0XG5cdFx0XHRpZiAoZGlzdGFuY2UgPCBjdXJyZW50Q2xvc2VzdERpc3RhbmNlKSB7XG5cdFx0XHRcdGN1cnJlbnRDbG9zZXN0RGlzdGFuY2UgPSBkaXN0YW5jZTtcblx0XHRcdFx0Y3VycmVudENsb3Nlc3RLZXl3b3JkID0ga2V5d29yZDtcblx0XHRcdH1cblx0XHR9XG5cdH1cblxuXHRyZXR1cm4gY3VycmVudENsb3Nlc3RLZXl3b3JkO1xufTtcblxuY29udmVydC5rZXl3b3JkLnJnYiA9IGZ1bmN0aW9uIChrZXl3b3JkKSB7XG5cdHJldHVybiBjc3NLZXl3b3Jkc1trZXl3b3JkXTtcbn07XG5cbmNvbnZlcnQucmdiLnh5eiA9IGZ1bmN0aW9uIChyZ2IpIHtcblx0dmFyIHIgPSByZ2JbMF0gLyAyNTU7XG5cdHZhciBnID0gcmdiWzFdIC8gMjU1O1xuXHR2YXIgYiA9IHJnYlsyXSAvIDI1NTtcblxuXHQvLyBhc3N1bWUgc1JHQlxuXHRyID0gciA+IDAuMDQwNDUgPyBNYXRoLnBvdygoKHIgKyAwLjA1NSkgLyAxLjA1NSksIDIuNCkgOiAociAvIDEyLjkyKTtcblx0ZyA9IGcgPiAwLjA0MDQ1ID8gTWF0aC5wb3coKChnICsgMC4wNTUpIC8gMS4wNTUpLCAyLjQpIDogKGcgLyAxMi45Mik7XG5cdGIgPSBiID4gMC4wNDA0NSA/IE1hdGgucG93KCgoYiArIDAuMDU1KSAvIDEuMDU1KSwgMi40KSA6IChiIC8gMTIuOTIpO1xuXG5cdHZhciB4ID0gKHIgKiAwLjQxMjQpICsgKGcgKiAwLjM1NzYpICsgKGIgKiAwLjE4MDUpO1xuXHR2YXIgeSA9IChyICogMC4yMTI2KSArIChnICogMC43MTUyKSArIChiICogMC4wNzIyKTtcblx0dmFyIHogPSAociAqIDAuMDE5MykgKyAoZyAqIDAuMTE5MikgKyAoYiAqIDAuOTUwNSk7XG5cblx0cmV0dXJuIFt4ICogMTAwLCB5ICogMTAwLCB6ICogMTAwXTtcbn07XG5cbmNvbnZlcnQucmdiLmxhYiA9IGZ1bmN0aW9uIChyZ2IpIHtcblx0dmFyIHh5eiA9IGNvbnZlcnQucmdiLnh5eihyZ2IpO1xuXHR2YXIgeCA9IHh5elswXTtcblx0dmFyIHkgPSB4eXpbMV07XG5cdHZhciB6ID0geHl6WzJdO1xuXHR2YXIgbDtcblx0dmFyIGE7XG5cdHZhciBiO1xuXG5cdHggLz0gOTUuMDQ3O1xuXHR5IC89IDEwMDtcblx0eiAvPSAxMDguODgzO1xuXG5cdHggPSB4ID4gMC4wMDg4NTYgPyBNYXRoLnBvdyh4LCAxIC8gMykgOiAoNy43ODcgKiB4KSArICgxNiAvIDExNik7XG5cdHkgPSB5ID4gMC4wMDg4NTYgPyBNYXRoLnBvdyh5LCAxIC8gMykgOiAoNy43ODcgKiB5KSArICgxNiAvIDExNik7XG5cdHogPSB6ID4gMC4wMDg4NTYgPyBNYXRoLnBvdyh6LCAxIC8gMykgOiAoNy43ODcgKiB6KSArICgxNiAvIDExNik7XG5cblx0bCA9ICgxMTYgKiB5KSAtIDE2O1xuXHRhID0gNTAwICogKHggLSB5KTtcblx0YiA9IDIwMCAqICh5IC0geik7XG5cblx0cmV0dXJuIFtsLCBhLCBiXTtcbn07XG5cbmNvbnZlcnQuaHNsLnJnYiA9IGZ1bmN0aW9uIChoc2wpIHtcblx0dmFyIGggPSBoc2xbMF0gLyAzNjA7XG5cdHZhciBzID0gaHNsWzFdIC8gMTAwO1xuXHR2YXIgbCA9IGhzbFsyXSAvIDEwMDtcblx0dmFyIHQxO1xuXHR2YXIgdDI7XG5cdHZhciB0Mztcblx0dmFyIHJnYjtcblx0dmFyIHZhbDtcblxuXHRpZiAocyA9PT0gMCkge1xuXHRcdHZhbCA9IGwgKiAyNTU7XG5cdFx0cmV0dXJuIFt2YWwsIHZhbCwgdmFsXTtcblx0fVxuXG5cdGlmIChsIDwgMC41KSB7XG5cdFx0dDIgPSBsICogKDEgKyBzKTtcblx0fSBlbHNlIHtcblx0XHR0MiA9IGwgKyBzIC0gbCAqIHM7XG5cdH1cblxuXHR0MSA9IDIgKiBsIC0gdDI7XG5cblx0cmdiID0gWzAsIDAsIDBdO1xuXHRmb3IgKHZhciBpID0gMDsgaSA8IDM7IGkrKykge1xuXHRcdHQzID0gaCArIDEgLyAzICogLShpIC0gMSk7XG5cdFx0aWYgKHQzIDwgMCkge1xuXHRcdFx0dDMrKztcblx0XHR9XG5cdFx0aWYgKHQzID4gMSkge1xuXHRcdFx0dDMtLTtcblx0XHR9XG5cblx0XHRpZiAoNiAqIHQzIDwgMSkge1xuXHRcdFx0dmFsID0gdDEgKyAodDIgLSB0MSkgKiA2ICogdDM7XG5cdFx0fSBlbHNlIGlmICgyICogdDMgPCAxKSB7XG5cdFx0XHR2YWwgPSB0Mjtcblx0XHR9IGVsc2UgaWYgKDMgKiB0MyA8IDIpIHtcblx0XHRcdHZhbCA9IHQxICsgKHQyIC0gdDEpICogKDIgLyAzIC0gdDMpICogNjtcblx0XHR9IGVsc2Uge1xuXHRcdFx0dmFsID0gdDE7XG5cdFx0fVxuXG5cdFx0cmdiW2ldID0gdmFsICogMjU1O1xuXHR9XG5cblx0cmV0dXJuIHJnYjtcbn07XG5cbmNvbnZlcnQuaHNsLmhzdiA9IGZ1bmN0aW9uIChoc2wpIHtcblx0dmFyIGggPSBoc2xbMF07XG5cdHZhciBzID0gaHNsWzFdIC8gMTAwO1xuXHR2YXIgbCA9IGhzbFsyXSAvIDEwMDtcblx0dmFyIHNtaW4gPSBzO1xuXHR2YXIgbG1pbiA9IE1hdGgubWF4KGwsIDAuMDEpO1xuXHR2YXIgc3Y7XG5cdHZhciB2O1xuXG5cdGwgKj0gMjtcblx0cyAqPSAobCA8PSAxKSA/IGwgOiAyIC0gbDtcblx0c21pbiAqPSBsbWluIDw9IDEgPyBsbWluIDogMiAtIGxtaW47XG5cdHYgPSAobCArIHMpIC8gMjtcblx0c3YgPSBsID09PSAwID8gKDIgKiBzbWluKSAvIChsbWluICsgc21pbikgOiAoMiAqIHMpIC8gKGwgKyBzKTtcblxuXHRyZXR1cm4gW2gsIHN2ICogMTAwLCB2ICogMTAwXTtcbn07XG5cbmNvbnZlcnQuaHN2LnJnYiA9IGZ1bmN0aW9uIChoc3YpIHtcblx0dmFyIGggPSBoc3ZbMF0gLyA2MDtcblx0dmFyIHMgPSBoc3ZbMV0gLyAxMDA7XG5cdHZhciB2ID0gaHN2WzJdIC8gMTAwO1xuXHR2YXIgaGkgPSBNYXRoLmZsb29yKGgpICUgNjtcblxuXHR2YXIgZiA9IGggLSBNYXRoLmZsb29yKGgpO1xuXHR2YXIgcCA9IDI1NSAqIHYgKiAoMSAtIHMpO1xuXHR2YXIgcSA9IDI1NSAqIHYgKiAoMSAtIChzICogZikpO1xuXHR2YXIgdCA9IDI1NSAqIHYgKiAoMSAtIChzICogKDEgLSBmKSkpO1xuXHR2ICo9IDI1NTtcblxuXHRzd2l0Y2ggKGhpKSB7XG5cdFx0Y2FzZSAwOlxuXHRcdFx0cmV0dXJuIFt2LCB0LCBwXTtcblx0XHRjYXNlIDE6XG5cdFx0XHRyZXR1cm4gW3EsIHYsIHBdO1xuXHRcdGNhc2UgMjpcblx0XHRcdHJldHVybiBbcCwgdiwgdF07XG5cdFx0Y2FzZSAzOlxuXHRcdFx0cmV0dXJuIFtwLCBxLCB2XTtcblx0XHRjYXNlIDQ6XG5cdFx0XHRyZXR1cm4gW3QsIHAsIHZdO1xuXHRcdGNhc2UgNTpcblx0XHRcdHJldHVybiBbdiwgcCwgcV07XG5cdH1cbn07XG5cbmNvbnZlcnQuaHN2LmhzbCA9IGZ1bmN0aW9uIChoc3YpIHtcblx0dmFyIGggPSBoc3ZbMF07XG5cdHZhciBzID0gaHN2WzFdIC8gMTAwO1xuXHR2YXIgdiA9IGhzdlsyXSAvIDEwMDtcblx0dmFyIHZtaW4gPSBNYXRoLm1heCh2LCAwLjAxKTtcblx0dmFyIGxtaW47XG5cdHZhciBzbDtcblx0dmFyIGw7XG5cblx0bCA9ICgyIC0gcykgKiB2O1xuXHRsbWluID0gKDIgLSBzKSAqIHZtaW47XG5cdHNsID0gcyAqIHZtaW47XG5cdHNsIC89IChsbWluIDw9IDEpID8gbG1pbiA6IDIgLSBsbWluO1xuXHRzbCA9IHNsIHx8IDA7XG5cdGwgLz0gMjtcblxuXHRyZXR1cm4gW2gsIHNsICogMTAwLCBsICogMTAwXTtcbn07XG5cbi8vIGh0dHA6Ly9kZXYudzMub3JnL2Nzc3dnL2Nzcy1jb2xvci8jaHdiLXRvLXJnYlxuY29udmVydC5od2IucmdiID0gZnVuY3Rpb24gKGh3Yikge1xuXHR2YXIgaCA9IGh3YlswXSAvIDM2MDtcblx0dmFyIHdoID0gaHdiWzFdIC8gMTAwO1xuXHR2YXIgYmwgPSBod2JbMl0gLyAxMDA7XG5cdHZhciByYXRpbyA9IHdoICsgYmw7XG5cdHZhciBpO1xuXHR2YXIgdjtcblx0dmFyIGY7XG5cdHZhciBuO1xuXG5cdC8vIHdoICsgYmwgY2FudCBiZSA+IDFcblx0aWYgKHJhdGlvID4gMSkge1xuXHRcdHdoIC89IHJhdGlvO1xuXHRcdGJsIC89IHJhdGlvO1xuXHR9XG5cblx0aSA9IE1hdGguZmxvb3IoNiAqIGgpO1xuXHR2ID0gMSAtIGJsO1xuXHRmID0gNiAqIGggLSBpO1xuXG5cdGlmICgoaSAmIDB4MDEpICE9PSAwKSB7XG5cdFx0ZiA9IDEgLSBmO1xuXHR9XG5cblx0biA9IHdoICsgZiAqICh2IC0gd2gpOyAvLyBsaW5lYXIgaW50ZXJwb2xhdGlvblxuXG5cdHZhciByO1xuXHR2YXIgZztcblx0dmFyIGI7XG5cdHN3aXRjaCAoaSkge1xuXHRcdGRlZmF1bHQ6XG5cdFx0Y2FzZSA2OlxuXHRcdGNhc2UgMDogciA9IHY7IGcgPSBuOyBiID0gd2g7IGJyZWFrO1xuXHRcdGNhc2UgMTogciA9IG47IGcgPSB2OyBiID0gd2g7IGJyZWFrO1xuXHRcdGNhc2UgMjogciA9IHdoOyBnID0gdjsgYiA9IG47IGJyZWFrO1xuXHRcdGNhc2UgMzogciA9IHdoOyBnID0gbjsgYiA9IHY7IGJyZWFrO1xuXHRcdGNhc2UgNDogciA9IG47IGcgPSB3aDsgYiA9IHY7IGJyZWFrO1xuXHRcdGNhc2UgNTogciA9IHY7IGcgPSB3aDsgYiA9IG47IGJyZWFrO1xuXHR9XG5cblx0cmV0dXJuIFtyICogMjU1LCBnICogMjU1LCBiICogMjU1XTtcbn07XG5cbmNvbnZlcnQuY215ay5yZ2IgPSBmdW5jdGlvbiAoY215aykge1xuXHR2YXIgYyA9IGNteWtbMF0gLyAxMDA7XG5cdHZhciBtID0gY215a1sxXSAvIDEwMDtcblx0dmFyIHkgPSBjbXlrWzJdIC8gMTAwO1xuXHR2YXIgayA9IGNteWtbM10gLyAxMDA7XG5cdHZhciByO1xuXHR2YXIgZztcblx0dmFyIGI7XG5cblx0ciA9IDEgLSBNYXRoLm1pbigxLCBjICogKDEgLSBrKSArIGspO1xuXHRnID0gMSAtIE1hdGgubWluKDEsIG0gKiAoMSAtIGspICsgayk7XG5cdGIgPSAxIC0gTWF0aC5taW4oMSwgeSAqICgxIC0gaykgKyBrKTtcblxuXHRyZXR1cm4gW3IgKiAyNTUsIGcgKiAyNTUsIGIgKiAyNTVdO1xufTtcblxuY29udmVydC54eXoucmdiID0gZnVuY3Rpb24gKHh5eikge1xuXHR2YXIgeCA9IHh5elswXSAvIDEwMDtcblx0dmFyIHkgPSB4eXpbMV0gLyAxMDA7XG5cdHZhciB6ID0geHl6WzJdIC8gMTAwO1xuXHR2YXIgcjtcblx0dmFyIGc7XG5cdHZhciBiO1xuXG5cdHIgPSAoeCAqIDMuMjQwNikgKyAoeSAqIC0xLjUzNzIpICsgKHogKiAtMC40OTg2KTtcblx0ZyA9ICh4ICogLTAuOTY4OSkgKyAoeSAqIDEuODc1OCkgKyAoeiAqIDAuMDQxNSk7XG5cdGIgPSAoeCAqIDAuMDU1NykgKyAoeSAqIC0wLjIwNDApICsgKHogKiAxLjA1NzApO1xuXG5cdC8vIGFzc3VtZSBzUkdCXG5cdHIgPSByID4gMC4wMDMxMzA4XG5cdFx0PyAoKDEuMDU1ICogTWF0aC5wb3cociwgMS4wIC8gMi40KSkgLSAwLjA1NSlcblx0XHQ6IHIgKiAxMi45MjtcblxuXHRnID0gZyA+IDAuMDAzMTMwOFxuXHRcdD8gKCgxLjA1NSAqIE1hdGgucG93KGcsIDEuMCAvIDIuNCkpIC0gMC4wNTUpXG5cdFx0OiBnICogMTIuOTI7XG5cblx0YiA9IGIgPiAwLjAwMzEzMDhcblx0XHQ/ICgoMS4wNTUgKiBNYXRoLnBvdyhiLCAxLjAgLyAyLjQpKSAtIDAuMDU1KVxuXHRcdDogYiAqIDEyLjkyO1xuXG5cdHIgPSBNYXRoLm1pbihNYXRoLm1heCgwLCByKSwgMSk7XG5cdGcgPSBNYXRoLm1pbihNYXRoLm1heCgwLCBnKSwgMSk7XG5cdGIgPSBNYXRoLm1pbihNYXRoLm1heCgwLCBiKSwgMSk7XG5cblx0cmV0dXJuIFtyICogMjU1LCBnICogMjU1LCBiICogMjU1XTtcbn07XG5cbmNvbnZlcnQueHl6LmxhYiA9IGZ1bmN0aW9uICh4eXopIHtcblx0dmFyIHggPSB4eXpbMF07XG5cdHZhciB5ID0geHl6WzFdO1xuXHR2YXIgeiA9IHh5elsyXTtcblx0dmFyIGw7XG5cdHZhciBhO1xuXHR2YXIgYjtcblxuXHR4IC89IDk1LjA0Nztcblx0eSAvPSAxMDA7XG5cdHogLz0gMTA4Ljg4MztcblxuXHR4ID0geCA+IDAuMDA4ODU2ID8gTWF0aC5wb3coeCwgMSAvIDMpIDogKDcuNzg3ICogeCkgKyAoMTYgLyAxMTYpO1xuXHR5ID0geSA+IDAuMDA4ODU2ID8gTWF0aC5wb3coeSwgMSAvIDMpIDogKDcuNzg3ICogeSkgKyAoMTYgLyAxMTYpO1xuXHR6ID0geiA+IDAuMDA4ODU2ID8gTWF0aC5wb3coeiwgMSAvIDMpIDogKDcuNzg3ICogeikgKyAoMTYgLyAxMTYpO1xuXG5cdGwgPSAoMTE2ICogeSkgLSAxNjtcblx0YSA9IDUwMCAqICh4IC0geSk7XG5cdGIgPSAyMDAgKiAoeSAtIHopO1xuXG5cdHJldHVybiBbbCwgYSwgYl07XG59O1xuXG5jb252ZXJ0LmxhYi54eXogPSBmdW5jdGlvbiAobGFiKSB7XG5cdHZhciBsID0gbGFiWzBdO1xuXHR2YXIgYSA9IGxhYlsxXTtcblx0dmFyIGIgPSBsYWJbMl07XG5cdHZhciB4O1xuXHR2YXIgeTtcblx0dmFyIHo7XG5cblx0eSA9IChsICsgMTYpIC8gMTE2O1xuXHR4ID0gYSAvIDUwMCArIHk7XG5cdHogPSB5IC0gYiAvIDIwMDtcblxuXHR2YXIgeTIgPSBNYXRoLnBvdyh5LCAzKTtcblx0dmFyIHgyID0gTWF0aC5wb3coeCwgMyk7XG5cdHZhciB6MiA9IE1hdGgucG93KHosIDMpO1xuXHR5ID0geTIgPiAwLjAwODg1NiA/IHkyIDogKHkgLSAxNiAvIDExNikgLyA3Ljc4Nztcblx0eCA9IHgyID4gMC4wMDg4NTYgPyB4MiA6ICh4IC0gMTYgLyAxMTYpIC8gNy43ODc7XG5cdHogPSB6MiA+IDAuMDA4ODU2ID8gejIgOiAoeiAtIDE2IC8gMTE2KSAvIDcuNzg3O1xuXG5cdHggKj0gOTUuMDQ3O1xuXHR5ICo9IDEwMDtcblx0eiAqPSAxMDguODgzO1xuXG5cdHJldHVybiBbeCwgeSwgel07XG59O1xuXG5jb252ZXJ0LmxhYi5sY2ggPSBmdW5jdGlvbiAobGFiKSB7XG5cdHZhciBsID0gbGFiWzBdO1xuXHR2YXIgYSA9IGxhYlsxXTtcblx0dmFyIGIgPSBsYWJbMl07XG5cdHZhciBocjtcblx0dmFyIGg7XG5cdHZhciBjO1xuXG5cdGhyID0gTWF0aC5hdGFuMihiLCBhKTtcblx0aCA9IGhyICogMzYwIC8gMiAvIE1hdGguUEk7XG5cblx0aWYgKGggPCAwKSB7XG5cdFx0aCArPSAzNjA7XG5cdH1cblxuXHRjID0gTWF0aC5zcXJ0KGEgKiBhICsgYiAqIGIpO1xuXG5cdHJldHVybiBbbCwgYywgaF07XG59O1xuXG5jb252ZXJ0LmxjaC5sYWIgPSBmdW5jdGlvbiAobGNoKSB7XG5cdHZhciBsID0gbGNoWzBdO1xuXHR2YXIgYyA9IGxjaFsxXTtcblx0dmFyIGggPSBsY2hbMl07XG5cdHZhciBhO1xuXHR2YXIgYjtcblx0dmFyIGhyO1xuXG5cdGhyID0gaCAvIDM2MCAqIDIgKiBNYXRoLlBJO1xuXHRhID0gYyAqIE1hdGguY29zKGhyKTtcblx0YiA9IGMgKiBNYXRoLnNpbihocik7XG5cblx0cmV0dXJuIFtsLCBhLCBiXTtcbn07XG5cbmNvbnZlcnQucmdiLmFuc2kxNiA9IGZ1bmN0aW9uIChhcmdzKSB7XG5cdHZhciByID0gYXJnc1swXTtcblx0dmFyIGcgPSBhcmdzWzFdO1xuXHR2YXIgYiA9IGFyZ3NbMl07XG5cdHZhciB2YWx1ZSA9IDEgaW4gYXJndW1lbnRzID8gYXJndW1lbnRzWzFdIDogY29udmVydC5yZ2IuaHN2KGFyZ3MpWzJdOyAvLyBoc3YgLT4gYW5zaTE2IG9wdGltaXphdGlvblxuXG5cdHZhbHVlID0gTWF0aC5yb3VuZCh2YWx1ZSAvIDUwKTtcblxuXHRpZiAodmFsdWUgPT09IDApIHtcblx0XHRyZXR1cm4gMzA7XG5cdH1cblxuXHR2YXIgYW5zaSA9IDMwXG5cdFx0KyAoKE1hdGgucm91bmQoYiAvIDI1NSkgPDwgMilcblx0XHR8IChNYXRoLnJvdW5kKGcgLyAyNTUpIDw8IDEpXG5cdFx0fCBNYXRoLnJvdW5kKHIgLyAyNTUpKTtcblxuXHRpZiAodmFsdWUgPT09IDIpIHtcblx0XHRhbnNpICs9IDYwO1xuXHR9XG5cblx0cmV0dXJuIGFuc2k7XG59O1xuXG5jb252ZXJ0Lmhzdi5hbnNpMTYgPSBmdW5jdGlvbiAoYXJncykge1xuXHQvLyBvcHRpbWl6YXRpb24gaGVyZTsgd2UgYWxyZWFkeSBrbm93IHRoZSB2YWx1ZSBhbmQgZG9uJ3QgbmVlZCB0byBnZXRcblx0Ly8gaXQgY29udmVydGVkIGZvciB1cy5cblx0cmV0dXJuIGNvbnZlcnQucmdiLmFuc2kxNihjb252ZXJ0Lmhzdi5yZ2IoYXJncyksIGFyZ3NbMl0pO1xufTtcblxuY29udmVydC5yZ2IuYW5zaTI1NiA9IGZ1bmN0aW9uIChhcmdzKSB7XG5cdHZhciByID0gYXJnc1swXTtcblx0dmFyIGcgPSBhcmdzWzFdO1xuXHR2YXIgYiA9IGFyZ3NbMl07XG5cblx0Ly8gd2UgdXNlIHRoZSBleHRlbmRlZCBncmV5c2NhbGUgcGFsZXR0ZSBoZXJlLCB3aXRoIHRoZSBleGNlcHRpb24gb2Zcblx0Ly8gYmxhY2sgYW5kIHdoaXRlLiBub3JtYWwgcGFsZXR0ZSBvbmx5IGhhcyA0IGdyZXlzY2FsZSBzaGFkZXMuXG5cdGlmIChyID09PSBnICYmIGcgPT09IGIpIHtcblx0XHRpZiAociA8IDgpIHtcblx0XHRcdHJldHVybiAxNjtcblx0XHR9XG5cblx0XHRpZiAociA+IDI0OCkge1xuXHRcdFx0cmV0dXJuIDIzMTtcblx0XHR9XG5cblx0XHRyZXR1cm4gTWF0aC5yb3VuZCgoKHIgLSA4KSAvIDI0NykgKiAyNCkgKyAyMzI7XG5cdH1cblxuXHR2YXIgYW5zaSA9IDE2XG5cdFx0KyAoMzYgKiBNYXRoLnJvdW5kKHIgLyAyNTUgKiA1KSlcblx0XHQrICg2ICogTWF0aC5yb3VuZChnIC8gMjU1ICogNSkpXG5cdFx0KyBNYXRoLnJvdW5kKGIgLyAyNTUgKiA1KTtcblxuXHRyZXR1cm4gYW5zaTtcbn07XG5cbmNvbnZlcnQuYW5zaTE2LnJnYiA9IGZ1bmN0aW9uIChhcmdzKSB7XG5cdHZhciBjb2xvciA9IGFyZ3MgJSAxMDtcblxuXHQvLyBoYW5kbGUgZ3JleXNjYWxlXG5cdGlmIChjb2xvciA9PT0gMCB8fCBjb2xvciA9PT0gNykge1xuXHRcdGlmIChhcmdzID4gNTApIHtcblx0XHRcdGNvbG9yICs9IDMuNTtcblx0XHR9XG5cblx0XHRjb2xvciA9IGNvbG9yIC8gMTAuNSAqIDI1NTtcblxuXHRcdHJldHVybiBbY29sb3IsIGNvbG9yLCBjb2xvcl07XG5cdH1cblxuXHR2YXIgbXVsdCA9ICh+fihhcmdzID4gNTApICsgMSkgKiAwLjU7XG5cdHZhciByID0gKChjb2xvciAmIDEpICogbXVsdCkgKiAyNTU7XG5cdHZhciBnID0gKCgoY29sb3IgPj4gMSkgJiAxKSAqIG11bHQpICogMjU1O1xuXHR2YXIgYiA9ICgoKGNvbG9yID4+IDIpICYgMSkgKiBtdWx0KSAqIDI1NTtcblxuXHRyZXR1cm4gW3IsIGcsIGJdO1xufTtcblxuY29udmVydC5hbnNpMjU2LnJnYiA9IGZ1bmN0aW9uIChhcmdzKSB7XG5cdC8vIGhhbmRsZSBncmV5c2NhbGVcblx0aWYgKGFyZ3MgPj0gMjMyKSB7XG5cdFx0dmFyIGMgPSAoYXJncyAtIDIzMikgKiAxMCArIDg7XG5cdFx0cmV0dXJuIFtjLCBjLCBjXTtcblx0fVxuXG5cdGFyZ3MgLT0gMTY7XG5cblx0dmFyIHJlbTtcblx0dmFyIHIgPSBNYXRoLmZsb29yKGFyZ3MgLyAzNikgLyA1ICogMjU1O1xuXHR2YXIgZyA9IE1hdGguZmxvb3IoKHJlbSA9IGFyZ3MgJSAzNikgLyA2KSAvIDUgKiAyNTU7XG5cdHZhciBiID0gKHJlbSAlIDYpIC8gNSAqIDI1NTtcblxuXHRyZXR1cm4gW3IsIGcsIGJdO1xufTtcblxuY29udmVydC5yZ2IuaGV4ID0gZnVuY3Rpb24gKGFyZ3MpIHtcblx0dmFyIGludGVnZXIgPSAoKE1hdGgucm91bmQoYXJnc1swXSkgJiAweEZGKSA8PCAxNilcblx0XHQrICgoTWF0aC5yb3VuZChhcmdzWzFdKSAmIDB4RkYpIDw8IDgpXG5cdFx0KyAoTWF0aC5yb3VuZChhcmdzWzJdKSAmIDB4RkYpO1xuXG5cdHZhciBzdHJpbmcgPSBpbnRlZ2VyLnRvU3RyaW5nKDE2KS50b1VwcGVyQ2FzZSgpO1xuXHRyZXR1cm4gJzAwMDAwMCcuc3Vic3RyaW5nKHN0cmluZy5sZW5ndGgpICsgc3RyaW5nO1xufTtcblxuY29udmVydC5oZXgucmdiID0gZnVuY3Rpb24gKGFyZ3MpIHtcblx0dmFyIG1hdGNoID0gYXJncy50b1N0cmluZygxNikubWF0Y2goL1thLWYwLTldezZ9fFthLWYwLTldezN9L2kpO1xuXHRpZiAoIW1hdGNoKSB7XG5cdFx0cmV0dXJuIFswLCAwLCAwXTtcblx0fVxuXG5cdHZhciBjb2xvclN0cmluZyA9IG1hdGNoWzBdO1xuXG5cdGlmIChtYXRjaFswXS5sZW5ndGggPT09IDMpIHtcblx0XHRjb2xvclN0cmluZyA9IGNvbG9yU3RyaW5nLnNwbGl0KCcnKS5tYXAoZnVuY3Rpb24gKGNoYXIpIHtcblx0XHRcdHJldHVybiBjaGFyICsgY2hhcjtcblx0XHR9KS5qb2luKCcnKTtcblx0fVxuXG5cdHZhciBpbnRlZ2VyID0gcGFyc2VJbnQoY29sb3JTdHJpbmcsIDE2KTtcblx0dmFyIHIgPSAoaW50ZWdlciA+PiAxNikgJiAweEZGO1xuXHR2YXIgZyA9IChpbnRlZ2VyID4+IDgpICYgMHhGRjtcblx0dmFyIGIgPSBpbnRlZ2VyICYgMHhGRjtcblxuXHRyZXR1cm4gW3IsIGcsIGJdO1xufTtcblxuY29udmVydC5yZ2IuaGNnID0gZnVuY3Rpb24gKHJnYikge1xuXHR2YXIgciA9IHJnYlswXSAvIDI1NTtcblx0dmFyIGcgPSByZ2JbMV0gLyAyNTU7XG5cdHZhciBiID0gcmdiWzJdIC8gMjU1O1xuXHR2YXIgbWF4ID0gTWF0aC5tYXgoTWF0aC5tYXgociwgZyksIGIpO1xuXHR2YXIgbWluID0gTWF0aC5taW4oTWF0aC5taW4ociwgZyksIGIpO1xuXHR2YXIgY2hyb21hID0gKG1heCAtIG1pbik7XG5cdHZhciBncmF5c2NhbGU7XG5cdHZhciBodWU7XG5cblx0aWYgKGNocm9tYSA8IDEpIHtcblx0XHRncmF5c2NhbGUgPSBtaW4gLyAoMSAtIGNocm9tYSk7XG5cdH0gZWxzZSB7XG5cdFx0Z3JheXNjYWxlID0gMDtcblx0fVxuXG5cdGlmIChjaHJvbWEgPD0gMCkge1xuXHRcdGh1ZSA9IDA7XG5cdH0gZWxzZVxuXHRpZiAobWF4ID09PSByKSB7XG5cdFx0aHVlID0gKChnIC0gYikgLyBjaHJvbWEpICUgNjtcblx0fSBlbHNlXG5cdGlmIChtYXggPT09IGcpIHtcblx0XHRodWUgPSAyICsgKGIgLSByKSAvIGNocm9tYTtcblx0fSBlbHNlIHtcblx0XHRodWUgPSA0ICsgKHIgLSBnKSAvIGNocm9tYSArIDQ7XG5cdH1cblxuXHRodWUgLz0gNjtcblx0aHVlICU9IDE7XG5cblx0cmV0dXJuIFtodWUgKiAzNjAsIGNocm9tYSAqIDEwMCwgZ3JheXNjYWxlICogMTAwXTtcbn07XG5cbmNvbnZlcnQuaHNsLmhjZyA9IGZ1bmN0aW9uIChoc2wpIHtcblx0dmFyIHMgPSBoc2xbMV0gLyAxMDA7XG5cdHZhciBsID0gaHNsWzJdIC8gMTAwO1xuXHR2YXIgYyA9IDE7XG5cdHZhciBmID0gMDtcblxuXHRpZiAobCA8IDAuNSkge1xuXHRcdGMgPSAyLjAgKiBzICogbDtcblx0fSBlbHNlIHtcblx0XHRjID0gMi4wICogcyAqICgxLjAgLSBsKTtcblx0fVxuXG5cdGlmIChjIDwgMS4wKSB7XG5cdFx0ZiA9IChsIC0gMC41ICogYykgLyAoMS4wIC0gYyk7XG5cdH1cblxuXHRyZXR1cm4gW2hzbFswXSwgYyAqIDEwMCwgZiAqIDEwMF07XG59O1xuXG5jb252ZXJ0Lmhzdi5oY2cgPSBmdW5jdGlvbiAoaHN2KSB7XG5cdHZhciBzID0gaHN2WzFdIC8gMTAwO1xuXHR2YXIgdiA9IGhzdlsyXSAvIDEwMDtcblxuXHR2YXIgYyA9IHMgKiB2O1xuXHR2YXIgZiA9IDA7XG5cblx0aWYgKGMgPCAxLjApIHtcblx0XHRmID0gKHYgLSBjKSAvICgxIC0gYyk7XG5cdH1cblxuXHRyZXR1cm4gW2hzdlswXSwgYyAqIDEwMCwgZiAqIDEwMF07XG59O1xuXG5jb252ZXJ0LmhjZy5yZ2IgPSBmdW5jdGlvbiAoaGNnKSB7XG5cdHZhciBoID0gaGNnWzBdIC8gMzYwO1xuXHR2YXIgYyA9IGhjZ1sxXSAvIDEwMDtcblx0dmFyIGcgPSBoY2dbMl0gLyAxMDA7XG5cblx0aWYgKGMgPT09IDAuMCkge1xuXHRcdHJldHVybiBbZyAqIDI1NSwgZyAqIDI1NSwgZyAqIDI1NV07XG5cdH1cblxuXHR2YXIgcHVyZSA9IFswLCAwLCAwXTtcblx0dmFyIGhpID0gKGggJSAxKSAqIDY7XG5cdHZhciB2ID0gaGkgJSAxO1xuXHR2YXIgdyA9IDEgLSB2O1xuXHR2YXIgbWcgPSAwO1xuXG5cdHN3aXRjaCAoTWF0aC5mbG9vcihoaSkpIHtcblx0XHRjYXNlIDA6XG5cdFx0XHRwdXJlWzBdID0gMTsgcHVyZVsxXSA9IHY7IHB1cmVbMl0gPSAwOyBicmVhaztcblx0XHRjYXNlIDE6XG5cdFx0XHRwdXJlWzBdID0gdzsgcHVyZVsxXSA9IDE7IHB1cmVbMl0gPSAwOyBicmVhaztcblx0XHRjYXNlIDI6XG5cdFx0XHRwdXJlWzBdID0gMDsgcHVyZVsxXSA9IDE7IHB1cmVbMl0gPSB2OyBicmVhaztcblx0XHRjYXNlIDM6XG5cdFx0XHRwdXJlWzBdID0gMDsgcHVyZVsxXSA9IHc7IHB1cmVbMl0gPSAxOyBicmVhaztcblx0XHRjYXNlIDQ6XG5cdFx0XHRwdXJlWzBdID0gdjsgcHVyZVsxXSA9IDA7IHB1cmVbMl0gPSAxOyBicmVhaztcblx0XHRkZWZhdWx0OlxuXHRcdFx0cHVyZVswXSA9IDE7IHB1cmVbMV0gPSAwOyBwdXJlWzJdID0gdztcblx0fVxuXG5cdG1nID0gKDEuMCAtIGMpICogZztcblxuXHRyZXR1cm4gW1xuXHRcdChjICogcHVyZVswXSArIG1nKSAqIDI1NSxcblx0XHQoYyAqIHB1cmVbMV0gKyBtZykgKiAyNTUsXG5cdFx0KGMgKiBwdXJlWzJdICsgbWcpICogMjU1XG5cdF07XG59O1xuXG5jb252ZXJ0LmhjZy5oc3YgPSBmdW5jdGlvbiAoaGNnKSB7XG5cdHZhciBjID0gaGNnWzFdIC8gMTAwO1xuXHR2YXIgZyA9IGhjZ1syXSAvIDEwMDtcblxuXHR2YXIgdiA9IGMgKyBnICogKDEuMCAtIGMpO1xuXHR2YXIgZiA9IDA7XG5cblx0aWYgKHYgPiAwLjApIHtcblx0XHRmID0gYyAvIHY7XG5cdH1cblxuXHRyZXR1cm4gW2hjZ1swXSwgZiAqIDEwMCwgdiAqIDEwMF07XG59O1xuXG5jb252ZXJ0LmhjZy5oc2wgPSBmdW5jdGlvbiAoaGNnKSB7XG5cdHZhciBjID0gaGNnWzFdIC8gMTAwO1xuXHR2YXIgZyA9IGhjZ1syXSAvIDEwMDtcblxuXHR2YXIgbCA9IGcgKiAoMS4wIC0gYykgKyAwLjUgKiBjO1xuXHR2YXIgcyA9IDA7XG5cblx0aWYgKGwgPiAwLjAgJiYgbCA8IDAuNSkge1xuXHRcdHMgPSBjIC8gKDIgKiBsKTtcblx0fSBlbHNlXG5cdGlmIChsID49IDAuNSAmJiBsIDwgMS4wKSB7XG5cdFx0cyA9IGMgLyAoMiAqICgxIC0gbCkpO1xuXHR9XG5cblx0cmV0dXJuIFtoY2dbMF0sIHMgKiAxMDAsIGwgKiAxMDBdO1xufTtcblxuY29udmVydC5oY2cuaHdiID0gZnVuY3Rpb24gKGhjZykge1xuXHR2YXIgYyA9IGhjZ1sxXSAvIDEwMDtcblx0dmFyIGcgPSBoY2dbMl0gLyAxMDA7XG5cdHZhciB2ID0gYyArIGcgKiAoMS4wIC0gYyk7XG5cdHJldHVybiBbaGNnWzBdLCAodiAtIGMpICogMTAwLCAoMSAtIHYpICogMTAwXTtcbn07XG5cbmNvbnZlcnQuaHdiLmhjZyA9IGZ1bmN0aW9uIChod2IpIHtcblx0dmFyIHcgPSBod2JbMV0gLyAxMDA7XG5cdHZhciBiID0gaHdiWzJdIC8gMTAwO1xuXHR2YXIgdiA9IDEgLSBiO1xuXHR2YXIgYyA9IHYgLSB3O1xuXHR2YXIgZyA9IDA7XG5cblx0aWYgKGMgPCAxKSB7XG5cdFx0ZyA9ICh2IC0gYykgLyAoMSAtIGMpO1xuXHR9XG5cblx0cmV0dXJuIFtod2JbMF0sIGMgKiAxMDAsIGcgKiAxMDBdO1xufTtcblxuY29udmVydC5hcHBsZS5yZ2IgPSBmdW5jdGlvbiAoYXBwbGUpIHtcblx0cmV0dXJuIFsoYXBwbGVbMF0gLyA2NTUzNSkgKiAyNTUsIChhcHBsZVsxXSAvIDY1NTM1KSAqIDI1NSwgKGFwcGxlWzJdIC8gNjU1MzUpICogMjU1XTtcbn07XG5cbmNvbnZlcnQucmdiLmFwcGxlID0gZnVuY3Rpb24gKHJnYikge1xuXHRyZXR1cm4gWyhyZ2JbMF0gLyAyNTUpICogNjU1MzUsIChyZ2JbMV0gLyAyNTUpICogNjU1MzUsIChyZ2JbMl0gLyAyNTUpICogNjU1MzVdO1xufTtcblxuY29udmVydC5ncmF5LnJnYiA9IGZ1bmN0aW9uIChhcmdzKSB7XG5cdHJldHVybiBbYXJnc1swXSAvIDEwMCAqIDI1NSwgYXJnc1swXSAvIDEwMCAqIDI1NSwgYXJnc1swXSAvIDEwMCAqIDI1NV07XG59O1xuXG5jb252ZXJ0LmdyYXkuaHNsID0gY29udmVydC5ncmF5LmhzdiA9IGZ1bmN0aW9uIChhcmdzKSB7XG5cdHJldHVybiBbMCwgMCwgYXJnc1swXV07XG59O1xuXG5jb252ZXJ0LmdyYXkuaHdiID0gZnVuY3Rpb24gKGdyYXkpIHtcblx0cmV0dXJuIFswLCAxMDAsIGdyYXlbMF1dO1xufTtcblxuY29udmVydC5ncmF5LmNteWsgPSBmdW5jdGlvbiAoZ3JheSkge1xuXHRyZXR1cm4gWzAsIDAsIDAsIGdyYXlbMF1dO1xufTtcblxuY29udmVydC5ncmF5LmxhYiA9IGZ1bmN0aW9uIChncmF5KSB7XG5cdHJldHVybiBbZ3JheVswXSwgMCwgMF07XG59O1xuXG5jb252ZXJ0LmdyYXkuaGV4ID0gZnVuY3Rpb24gKGdyYXkpIHtcblx0dmFyIHZhbCA9IE1hdGgucm91bmQoZ3JheVswXSAvIDEwMCAqIDI1NSkgJiAweEZGO1xuXHR2YXIgaW50ZWdlciA9ICh2YWwgPDwgMTYpICsgKHZhbCA8PCA4KSArIHZhbDtcblxuXHR2YXIgc3RyaW5nID0gaW50ZWdlci50b1N0cmluZygxNikudG9VcHBlckNhc2UoKTtcblx0cmV0dXJuICcwMDAwMDAnLnN1YnN0cmluZyhzdHJpbmcubGVuZ3RoKSArIHN0cmluZztcbn07XG5cbmNvbnZlcnQucmdiLmdyYXkgPSBmdW5jdGlvbiAocmdiKSB7XG5cdHZhciB2YWwgPSAocmdiWzBdICsgcmdiWzFdICsgcmdiWzJdKSAvIDM7XG5cdHJldHVybiBbdmFsIC8gMjU1ICogMTAwXTtcbn07XG4iLCJ2YXIgY29udmVyc2lvbnMgPSByZXF1aXJlKCcuL2NvbnZlcnNpb25zJyk7XG52YXIgcm91dGUgPSByZXF1aXJlKCcuL3JvdXRlJyk7XG5cbnZhciBjb252ZXJ0ID0ge307XG5cbnZhciBtb2RlbHMgPSBPYmplY3Qua2V5cyhjb252ZXJzaW9ucyk7XG5cbmZ1bmN0aW9uIHdyYXBSYXcoZm4pIHtcblx0dmFyIHdyYXBwZWRGbiA9IGZ1bmN0aW9uIChhcmdzKSB7XG5cdFx0aWYgKGFyZ3MgPT09IHVuZGVmaW5lZCB8fCBhcmdzID09PSBudWxsKSB7XG5cdFx0XHRyZXR1cm4gYXJncztcblx0XHR9XG5cblx0XHRpZiAoYXJndW1lbnRzLmxlbmd0aCA+IDEpIHtcblx0XHRcdGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMpO1xuXHRcdH1cblxuXHRcdHJldHVybiBmbihhcmdzKTtcblx0fTtcblxuXHQvLyBwcmVzZXJ2ZSAuY29udmVyc2lvbiBwcm9wZXJ0eSBpZiB0aGVyZSBpcyBvbmVcblx0aWYgKCdjb252ZXJzaW9uJyBpbiBmbikge1xuXHRcdHdyYXBwZWRGbi5jb252ZXJzaW9uID0gZm4uY29udmVyc2lvbjtcblx0fVxuXG5cdHJldHVybiB3cmFwcGVkRm47XG59XG5cbmZ1bmN0aW9uIHdyYXBSb3VuZGVkKGZuKSB7XG5cdHZhciB3cmFwcGVkRm4gPSBmdW5jdGlvbiAoYXJncykge1xuXHRcdGlmIChhcmdzID09PSB1bmRlZmluZWQgfHwgYXJncyA9PT0gbnVsbCkge1xuXHRcdFx0cmV0dXJuIGFyZ3M7XG5cdFx0fVxuXG5cdFx0aWYgKGFyZ3VtZW50cy5sZW5ndGggPiAxKSB7XG5cdFx0XHRhcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzKTtcblx0XHR9XG5cblx0XHR2YXIgcmVzdWx0ID0gZm4oYXJncyk7XG5cblx0XHQvLyB3ZSdyZSBhc3N1bWluZyB0aGUgcmVzdWx0IGlzIGFuIGFycmF5IGhlcmUuXG5cdFx0Ly8gc2VlIG5vdGljZSBpbiBjb252ZXJzaW9ucy5qczsgZG9uJ3QgdXNlIGJveCB0eXBlc1xuXHRcdC8vIGluIGNvbnZlcnNpb24gZnVuY3Rpb25zLlxuXHRcdGlmICh0eXBlb2YgcmVzdWx0ID09PSAnb2JqZWN0Jykge1xuXHRcdFx0Zm9yICh2YXIgbGVuID0gcmVzdWx0Lmxlbmd0aCwgaSA9IDA7IGkgPCBsZW47IGkrKykge1xuXHRcdFx0XHRyZXN1bHRbaV0gPSBNYXRoLnJvdW5kKHJlc3VsdFtpXSk7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHJlc3VsdDtcblx0fTtcblxuXHQvLyBwcmVzZXJ2ZSAuY29udmVyc2lvbiBwcm9wZXJ0eSBpZiB0aGVyZSBpcyBvbmVcblx0aWYgKCdjb252ZXJzaW9uJyBpbiBmbikge1xuXHRcdHdyYXBwZWRGbi5jb252ZXJzaW9uID0gZm4uY29udmVyc2lvbjtcblx0fVxuXG5cdHJldHVybiB3cmFwcGVkRm47XG59XG5cbm1vZGVscy5mb3JFYWNoKGZ1bmN0aW9uIChmcm9tTW9kZWwpIHtcblx0Y29udmVydFtmcm9tTW9kZWxdID0ge307XG5cblx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGNvbnZlcnRbZnJvbU1vZGVsXSwgJ2NoYW5uZWxzJywge3ZhbHVlOiBjb252ZXJzaW9uc1tmcm9tTW9kZWxdLmNoYW5uZWxzfSk7XG5cdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShjb252ZXJ0W2Zyb21Nb2RlbF0sICdsYWJlbHMnLCB7dmFsdWU6IGNvbnZlcnNpb25zW2Zyb21Nb2RlbF0ubGFiZWxzfSk7XG5cblx0dmFyIHJvdXRlcyA9IHJvdXRlKGZyb21Nb2RlbCk7XG5cdHZhciByb3V0ZU1vZGVscyA9IE9iamVjdC5rZXlzKHJvdXRlcyk7XG5cblx0cm91dGVNb2RlbHMuZm9yRWFjaChmdW5jdGlvbiAodG9Nb2RlbCkge1xuXHRcdHZhciBmbiA9IHJvdXRlc1t0b01vZGVsXTtcblxuXHRcdGNvbnZlcnRbZnJvbU1vZGVsXVt0b01vZGVsXSA9IHdyYXBSb3VuZGVkKGZuKTtcblx0XHRjb252ZXJ0W2Zyb21Nb2RlbF1bdG9Nb2RlbF0ucmF3ID0gd3JhcFJhdyhmbik7XG5cdH0pO1xufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gY29udmVydDtcbiIsInZhciBjb252ZXJzaW9ucyA9IHJlcXVpcmUoJy4vY29udmVyc2lvbnMnKTtcblxuLypcblx0dGhpcyBmdW5jdGlvbiByb3V0ZXMgYSBtb2RlbCB0byBhbGwgb3RoZXIgbW9kZWxzLlxuXG5cdGFsbCBmdW5jdGlvbnMgdGhhdCBhcmUgcm91dGVkIGhhdmUgYSBwcm9wZXJ0eSBgLmNvbnZlcnNpb25gIGF0dGFjaGVkXG5cdHRvIHRoZSByZXR1cm5lZCBzeW50aGV0aWMgZnVuY3Rpb24uIFRoaXMgcHJvcGVydHkgaXMgYW4gYXJyYXlcblx0b2Ygc3RyaW5ncywgZWFjaCB3aXRoIHRoZSBzdGVwcyBpbiBiZXR3ZWVuIHRoZSAnZnJvbScgYW5kICd0bydcblx0Y29sb3IgbW9kZWxzIChpbmNsdXNpdmUpLlxuXG5cdGNvbnZlcnNpb25zIHRoYXQgYXJlIG5vdCBwb3NzaWJsZSBzaW1wbHkgYXJlIG5vdCBpbmNsdWRlZC5cbiovXG5cbmZ1bmN0aW9uIGJ1aWxkR3JhcGgoKSB7XG5cdHZhciBncmFwaCA9IHt9O1xuXHQvLyBodHRwczovL2pzcGVyZi5jb20vb2JqZWN0LWtleXMtdnMtZm9yLWluLXdpdGgtY2xvc3VyZS8zXG5cdHZhciBtb2RlbHMgPSBPYmplY3Qua2V5cyhjb252ZXJzaW9ucyk7XG5cblx0Zm9yICh2YXIgbGVuID0gbW9kZWxzLmxlbmd0aCwgaSA9IDA7IGkgPCBsZW47IGkrKykge1xuXHRcdGdyYXBoW21vZGVsc1tpXV0gPSB7XG5cdFx0XHQvLyBodHRwOi8vanNwZXJmLmNvbS8xLXZzLWluZmluaXR5XG5cdFx0XHQvLyBtaWNyby1vcHQsIGJ1dCB0aGlzIGlzIHNpbXBsZS5cblx0XHRcdGRpc3RhbmNlOiAtMSxcblx0XHRcdHBhcmVudDogbnVsbFxuXHRcdH07XG5cdH1cblxuXHRyZXR1cm4gZ3JhcGg7XG59XG5cbi8vIGh0dHBzOi8vZW4ud2lraXBlZGlhLm9yZy93aWtpL0JyZWFkdGgtZmlyc3Rfc2VhcmNoXG5mdW5jdGlvbiBkZXJpdmVCRlMoZnJvbU1vZGVsKSB7XG5cdHZhciBncmFwaCA9IGJ1aWxkR3JhcGgoKTtcblx0dmFyIHF1ZXVlID0gW2Zyb21Nb2RlbF07IC8vIHVuc2hpZnQgLT4gcXVldWUgLT4gcG9wXG5cblx0Z3JhcGhbZnJvbU1vZGVsXS5kaXN0YW5jZSA9IDA7XG5cblx0d2hpbGUgKHF1ZXVlLmxlbmd0aCkge1xuXHRcdHZhciBjdXJyZW50ID0gcXVldWUucG9wKCk7XG5cdFx0dmFyIGFkamFjZW50cyA9IE9iamVjdC5rZXlzKGNvbnZlcnNpb25zW2N1cnJlbnRdKTtcblxuXHRcdGZvciAodmFyIGxlbiA9IGFkamFjZW50cy5sZW5ndGgsIGkgPSAwOyBpIDwgbGVuOyBpKyspIHtcblx0XHRcdHZhciBhZGphY2VudCA9IGFkamFjZW50c1tpXTtcblx0XHRcdHZhciBub2RlID0gZ3JhcGhbYWRqYWNlbnRdO1xuXG5cdFx0XHRpZiAobm9kZS5kaXN0YW5jZSA9PT0gLTEpIHtcblx0XHRcdFx0bm9kZS5kaXN0YW5jZSA9IGdyYXBoW2N1cnJlbnRdLmRpc3RhbmNlICsgMTtcblx0XHRcdFx0bm9kZS5wYXJlbnQgPSBjdXJyZW50O1xuXHRcdFx0XHRxdWV1ZS51bnNoaWZ0KGFkamFjZW50KTtcblx0XHRcdH1cblx0XHR9XG5cdH1cblxuXHRyZXR1cm4gZ3JhcGg7XG59XG5cbmZ1bmN0aW9uIGxpbmsoZnJvbSwgdG8pIHtcblx0cmV0dXJuIGZ1bmN0aW9uIChhcmdzKSB7XG5cdFx0cmV0dXJuIHRvKGZyb20oYXJncykpO1xuXHR9O1xufVxuXG5mdW5jdGlvbiB3cmFwQ29udmVyc2lvbih0b01vZGVsLCBncmFwaCkge1xuXHR2YXIgcGF0aCA9IFtncmFwaFt0b01vZGVsXS5wYXJlbnQsIHRvTW9kZWxdO1xuXHR2YXIgZm4gPSBjb252ZXJzaW9uc1tncmFwaFt0b01vZGVsXS5wYXJlbnRdW3RvTW9kZWxdO1xuXG5cdHZhciBjdXIgPSBncmFwaFt0b01vZGVsXS5wYXJlbnQ7XG5cdHdoaWxlIChncmFwaFtjdXJdLnBhcmVudCkge1xuXHRcdHBhdGgudW5zaGlmdChncmFwaFtjdXJdLnBhcmVudCk7XG5cdFx0Zm4gPSBsaW5rKGNvbnZlcnNpb25zW2dyYXBoW2N1cl0ucGFyZW50XVtjdXJdLCBmbik7XG5cdFx0Y3VyID0gZ3JhcGhbY3VyXS5wYXJlbnQ7XG5cdH1cblxuXHRmbi5jb252ZXJzaW9uID0gcGF0aDtcblx0cmV0dXJuIGZuO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChmcm9tTW9kZWwpIHtcblx0dmFyIGdyYXBoID0gZGVyaXZlQkZTKGZyb21Nb2RlbCk7XG5cdHZhciBjb252ZXJzaW9uID0ge307XG5cblx0dmFyIG1vZGVscyA9IE9iamVjdC5rZXlzKGdyYXBoKTtcblx0Zm9yICh2YXIgbGVuID0gbW9kZWxzLmxlbmd0aCwgaSA9IDA7IGkgPCBsZW47IGkrKykge1xuXHRcdHZhciB0b01vZGVsID0gbW9kZWxzW2ldO1xuXHRcdHZhciBub2RlID0gZ3JhcGhbdG9Nb2RlbF07XG5cblx0XHRpZiAobm9kZS5wYXJlbnQgPT09IG51bGwpIHtcblx0XHRcdC8vIG5vIHBvc3NpYmxlIGNvbnZlcnNpb24sIG9yIHRoaXMgbm9kZSBpcyB0aGUgc291cmNlIG1vZGVsLlxuXHRcdFx0Y29udGludWU7XG5cdFx0fVxuXG5cdFx0Y29udmVyc2lvblt0b01vZGVsXSA9IHdyYXBDb252ZXJzaW9uKHRvTW9kZWwsIGdyYXBoKTtcblx0fVxuXG5cdHJldHVybiBjb252ZXJzaW9uO1xufTtcblxuIiwiJ3VzZSBzdHJpY3QnXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuXHRcImFsaWNlYmx1ZVwiOiBbMjQwLCAyNDgsIDI1NV0sXHJcblx0XCJhbnRpcXVld2hpdGVcIjogWzI1MCwgMjM1LCAyMTVdLFxyXG5cdFwiYXF1YVwiOiBbMCwgMjU1LCAyNTVdLFxyXG5cdFwiYXF1YW1hcmluZVwiOiBbMTI3LCAyNTUsIDIxMl0sXHJcblx0XCJhenVyZVwiOiBbMjQwLCAyNTUsIDI1NV0sXHJcblx0XCJiZWlnZVwiOiBbMjQ1LCAyNDUsIDIyMF0sXHJcblx0XCJiaXNxdWVcIjogWzI1NSwgMjI4LCAxOTZdLFxyXG5cdFwiYmxhY2tcIjogWzAsIDAsIDBdLFxyXG5cdFwiYmxhbmNoZWRhbG1vbmRcIjogWzI1NSwgMjM1LCAyMDVdLFxyXG5cdFwiYmx1ZVwiOiBbMCwgMCwgMjU1XSxcclxuXHRcImJsdWV2aW9sZXRcIjogWzEzOCwgNDMsIDIyNl0sXHJcblx0XCJicm93blwiOiBbMTY1LCA0MiwgNDJdLFxyXG5cdFwiYnVybHl3b29kXCI6IFsyMjIsIDE4NCwgMTM1XSxcclxuXHRcImNhZGV0Ymx1ZVwiOiBbOTUsIDE1OCwgMTYwXSxcclxuXHRcImNoYXJ0cmV1c2VcIjogWzEyNywgMjU1LCAwXSxcclxuXHRcImNob2NvbGF0ZVwiOiBbMjEwLCAxMDUsIDMwXSxcclxuXHRcImNvcmFsXCI6IFsyNTUsIDEyNywgODBdLFxyXG5cdFwiY29ybmZsb3dlcmJsdWVcIjogWzEwMCwgMTQ5LCAyMzddLFxyXG5cdFwiY29ybnNpbGtcIjogWzI1NSwgMjQ4LCAyMjBdLFxyXG5cdFwiY3JpbXNvblwiOiBbMjIwLCAyMCwgNjBdLFxyXG5cdFwiY3lhblwiOiBbMCwgMjU1LCAyNTVdLFxyXG5cdFwiZGFya2JsdWVcIjogWzAsIDAsIDEzOV0sXHJcblx0XCJkYXJrY3lhblwiOiBbMCwgMTM5LCAxMzldLFxyXG5cdFwiZGFya2dvbGRlbnJvZFwiOiBbMTg0LCAxMzQsIDExXSxcclxuXHRcImRhcmtncmF5XCI6IFsxNjksIDE2OSwgMTY5XSxcclxuXHRcImRhcmtncmVlblwiOiBbMCwgMTAwLCAwXSxcclxuXHRcImRhcmtncmV5XCI6IFsxNjksIDE2OSwgMTY5XSxcclxuXHRcImRhcmtraGFraVwiOiBbMTg5LCAxODMsIDEwN10sXHJcblx0XCJkYXJrbWFnZW50YVwiOiBbMTM5LCAwLCAxMzldLFxyXG5cdFwiZGFya29saXZlZ3JlZW5cIjogWzg1LCAxMDcsIDQ3XSxcclxuXHRcImRhcmtvcmFuZ2VcIjogWzI1NSwgMTQwLCAwXSxcclxuXHRcImRhcmtvcmNoaWRcIjogWzE1MywgNTAsIDIwNF0sXHJcblx0XCJkYXJrcmVkXCI6IFsxMzksIDAsIDBdLFxyXG5cdFwiZGFya3NhbG1vblwiOiBbMjMzLCAxNTAsIDEyMl0sXHJcblx0XCJkYXJrc2VhZ3JlZW5cIjogWzE0MywgMTg4LCAxNDNdLFxyXG5cdFwiZGFya3NsYXRlYmx1ZVwiOiBbNzIsIDYxLCAxMzldLFxyXG5cdFwiZGFya3NsYXRlZ3JheVwiOiBbNDcsIDc5LCA3OV0sXHJcblx0XCJkYXJrc2xhdGVncmV5XCI6IFs0NywgNzksIDc5XSxcclxuXHRcImRhcmt0dXJxdW9pc2VcIjogWzAsIDIwNiwgMjA5XSxcclxuXHRcImRhcmt2aW9sZXRcIjogWzE0OCwgMCwgMjExXSxcclxuXHRcImRlZXBwaW5rXCI6IFsyNTUsIDIwLCAxNDddLFxyXG5cdFwiZGVlcHNreWJsdWVcIjogWzAsIDE5MSwgMjU1XSxcclxuXHRcImRpbWdyYXlcIjogWzEwNSwgMTA1LCAxMDVdLFxyXG5cdFwiZGltZ3JleVwiOiBbMTA1LCAxMDUsIDEwNV0sXHJcblx0XCJkb2RnZXJibHVlXCI6IFszMCwgMTQ0LCAyNTVdLFxyXG5cdFwiZmlyZWJyaWNrXCI6IFsxNzgsIDM0LCAzNF0sXHJcblx0XCJmbG9yYWx3aGl0ZVwiOiBbMjU1LCAyNTAsIDI0MF0sXHJcblx0XCJmb3Jlc3RncmVlblwiOiBbMzQsIDEzOSwgMzRdLFxyXG5cdFwiZnVjaHNpYVwiOiBbMjU1LCAwLCAyNTVdLFxyXG5cdFwiZ2FpbnNib3JvXCI6IFsyMjAsIDIyMCwgMjIwXSxcclxuXHRcImdob3N0d2hpdGVcIjogWzI0OCwgMjQ4LCAyNTVdLFxyXG5cdFwiZ29sZFwiOiBbMjU1LCAyMTUsIDBdLFxyXG5cdFwiZ29sZGVucm9kXCI6IFsyMTgsIDE2NSwgMzJdLFxyXG5cdFwiZ3JheVwiOiBbMTI4LCAxMjgsIDEyOF0sXHJcblx0XCJncmVlblwiOiBbMCwgMTI4LCAwXSxcclxuXHRcImdyZWVueWVsbG93XCI6IFsxNzMsIDI1NSwgNDddLFxyXG5cdFwiZ3JleVwiOiBbMTI4LCAxMjgsIDEyOF0sXHJcblx0XCJob25leWRld1wiOiBbMjQwLCAyNTUsIDI0MF0sXHJcblx0XCJob3RwaW5rXCI6IFsyNTUsIDEwNSwgMTgwXSxcclxuXHRcImluZGlhbnJlZFwiOiBbMjA1LCA5MiwgOTJdLFxyXG5cdFwiaW5kaWdvXCI6IFs3NSwgMCwgMTMwXSxcclxuXHRcIml2b3J5XCI6IFsyNTUsIDI1NSwgMjQwXSxcclxuXHRcImtoYWtpXCI6IFsyNDAsIDIzMCwgMTQwXSxcclxuXHRcImxhdmVuZGVyXCI6IFsyMzAsIDIzMCwgMjUwXSxcclxuXHRcImxhdmVuZGVyYmx1c2hcIjogWzI1NSwgMjQwLCAyNDVdLFxyXG5cdFwibGF3bmdyZWVuXCI6IFsxMjQsIDI1MiwgMF0sXHJcblx0XCJsZW1vbmNoaWZmb25cIjogWzI1NSwgMjUwLCAyMDVdLFxyXG5cdFwibGlnaHRibHVlXCI6IFsxNzMsIDIxNiwgMjMwXSxcclxuXHRcImxpZ2h0Y29yYWxcIjogWzI0MCwgMTI4LCAxMjhdLFxyXG5cdFwibGlnaHRjeWFuXCI6IFsyMjQsIDI1NSwgMjU1XSxcclxuXHRcImxpZ2h0Z29sZGVucm9keWVsbG93XCI6IFsyNTAsIDI1MCwgMjEwXSxcclxuXHRcImxpZ2h0Z3JheVwiOiBbMjExLCAyMTEsIDIxMV0sXHJcblx0XCJsaWdodGdyZWVuXCI6IFsxNDQsIDIzOCwgMTQ0XSxcclxuXHRcImxpZ2h0Z3JleVwiOiBbMjExLCAyMTEsIDIxMV0sXHJcblx0XCJsaWdodHBpbmtcIjogWzI1NSwgMTgyLCAxOTNdLFxyXG5cdFwibGlnaHRzYWxtb25cIjogWzI1NSwgMTYwLCAxMjJdLFxyXG5cdFwibGlnaHRzZWFncmVlblwiOiBbMzIsIDE3OCwgMTcwXSxcclxuXHRcImxpZ2h0c2t5Ymx1ZVwiOiBbMTM1LCAyMDYsIDI1MF0sXHJcblx0XCJsaWdodHNsYXRlZ3JheVwiOiBbMTE5LCAxMzYsIDE1M10sXHJcblx0XCJsaWdodHNsYXRlZ3JleVwiOiBbMTE5LCAxMzYsIDE1M10sXHJcblx0XCJsaWdodHN0ZWVsYmx1ZVwiOiBbMTc2LCAxOTYsIDIyMl0sXHJcblx0XCJsaWdodHllbGxvd1wiOiBbMjU1LCAyNTUsIDIyNF0sXHJcblx0XCJsaW1lXCI6IFswLCAyNTUsIDBdLFxyXG5cdFwibGltZWdyZWVuXCI6IFs1MCwgMjA1LCA1MF0sXHJcblx0XCJsaW5lblwiOiBbMjUwLCAyNDAsIDIzMF0sXHJcblx0XCJtYWdlbnRhXCI6IFsyNTUsIDAsIDI1NV0sXHJcblx0XCJtYXJvb25cIjogWzEyOCwgMCwgMF0sXHJcblx0XCJtZWRpdW1hcXVhbWFyaW5lXCI6IFsxMDIsIDIwNSwgMTcwXSxcclxuXHRcIm1lZGl1bWJsdWVcIjogWzAsIDAsIDIwNV0sXHJcblx0XCJtZWRpdW1vcmNoaWRcIjogWzE4NiwgODUsIDIxMV0sXHJcblx0XCJtZWRpdW1wdXJwbGVcIjogWzE0NywgMTEyLCAyMTldLFxyXG5cdFwibWVkaXVtc2VhZ3JlZW5cIjogWzYwLCAxNzksIDExM10sXHJcblx0XCJtZWRpdW1zbGF0ZWJsdWVcIjogWzEyMywgMTA0LCAyMzhdLFxyXG5cdFwibWVkaXVtc3ByaW5nZ3JlZW5cIjogWzAsIDI1MCwgMTU0XSxcclxuXHRcIm1lZGl1bXR1cnF1b2lzZVwiOiBbNzIsIDIwOSwgMjA0XSxcclxuXHRcIm1lZGl1bXZpb2xldHJlZFwiOiBbMTk5LCAyMSwgMTMzXSxcclxuXHRcIm1pZG5pZ2h0Ymx1ZVwiOiBbMjUsIDI1LCAxMTJdLFxyXG5cdFwibWludGNyZWFtXCI6IFsyNDUsIDI1NSwgMjUwXSxcclxuXHRcIm1pc3R5cm9zZVwiOiBbMjU1LCAyMjgsIDIyNV0sXHJcblx0XCJtb2NjYXNpblwiOiBbMjU1LCAyMjgsIDE4MV0sXHJcblx0XCJuYXZham93aGl0ZVwiOiBbMjU1LCAyMjIsIDE3M10sXHJcblx0XCJuYXZ5XCI6IFswLCAwLCAxMjhdLFxyXG5cdFwib2xkbGFjZVwiOiBbMjUzLCAyNDUsIDIzMF0sXHJcblx0XCJvbGl2ZVwiOiBbMTI4LCAxMjgsIDBdLFxyXG5cdFwib2xpdmVkcmFiXCI6IFsxMDcsIDE0MiwgMzVdLFxyXG5cdFwib3JhbmdlXCI6IFsyNTUsIDE2NSwgMF0sXHJcblx0XCJvcmFuZ2VyZWRcIjogWzI1NSwgNjksIDBdLFxyXG5cdFwib3JjaGlkXCI6IFsyMTgsIDExMiwgMjE0XSxcclxuXHRcInBhbGVnb2xkZW5yb2RcIjogWzIzOCwgMjMyLCAxNzBdLFxyXG5cdFwicGFsZWdyZWVuXCI6IFsxNTIsIDI1MSwgMTUyXSxcclxuXHRcInBhbGV0dXJxdW9pc2VcIjogWzE3NSwgMjM4LCAyMzhdLFxyXG5cdFwicGFsZXZpb2xldHJlZFwiOiBbMjE5LCAxMTIsIDE0N10sXHJcblx0XCJwYXBheWF3aGlwXCI6IFsyNTUsIDIzOSwgMjEzXSxcclxuXHRcInBlYWNocHVmZlwiOiBbMjU1LCAyMTgsIDE4NV0sXHJcblx0XCJwZXJ1XCI6IFsyMDUsIDEzMywgNjNdLFxyXG5cdFwicGlua1wiOiBbMjU1LCAxOTIsIDIwM10sXHJcblx0XCJwbHVtXCI6IFsyMjEsIDE2MCwgMjIxXSxcclxuXHRcInBvd2RlcmJsdWVcIjogWzE3NiwgMjI0LCAyMzBdLFxyXG5cdFwicHVycGxlXCI6IFsxMjgsIDAsIDEyOF0sXHJcblx0XCJyZWJlY2NhcHVycGxlXCI6IFsxMDIsIDUxLCAxNTNdLFxyXG5cdFwicmVkXCI6IFsyNTUsIDAsIDBdLFxyXG5cdFwicm9zeWJyb3duXCI6IFsxODgsIDE0MywgMTQzXSxcclxuXHRcInJveWFsYmx1ZVwiOiBbNjUsIDEwNSwgMjI1XSxcclxuXHRcInNhZGRsZWJyb3duXCI6IFsxMzksIDY5LCAxOV0sXHJcblx0XCJzYWxtb25cIjogWzI1MCwgMTI4LCAxMTRdLFxyXG5cdFwic2FuZHlicm93blwiOiBbMjQ0LCAxNjQsIDk2XSxcclxuXHRcInNlYWdyZWVuXCI6IFs0NiwgMTM5LCA4N10sXHJcblx0XCJzZWFzaGVsbFwiOiBbMjU1LCAyNDUsIDIzOF0sXHJcblx0XCJzaWVubmFcIjogWzE2MCwgODIsIDQ1XSxcclxuXHRcInNpbHZlclwiOiBbMTkyLCAxOTIsIDE5Ml0sXHJcblx0XCJza3libHVlXCI6IFsxMzUsIDIwNiwgMjM1XSxcclxuXHRcInNsYXRlYmx1ZVwiOiBbMTA2LCA5MCwgMjA1XSxcclxuXHRcInNsYXRlZ3JheVwiOiBbMTEyLCAxMjgsIDE0NF0sXHJcblx0XCJzbGF0ZWdyZXlcIjogWzExMiwgMTI4LCAxNDRdLFxyXG5cdFwic25vd1wiOiBbMjU1LCAyNTAsIDI1MF0sXHJcblx0XCJzcHJpbmdncmVlblwiOiBbMCwgMjU1LCAxMjddLFxyXG5cdFwic3RlZWxibHVlXCI6IFs3MCwgMTMwLCAxODBdLFxyXG5cdFwidGFuXCI6IFsyMTAsIDE4MCwgMTQwXSxcclxuXHRcInRlYWxcIjogWzAsIDEyOCwgMTI4XSxcclxuXHRcInRoaXN0bGVcIjogWzIxNiwgMTkxLCAyMTZdLFxyXG5cdFwidG9tYXRvXCI6IFsyNTUsIDk5LCA3MV0sXHJcblx0XCJ0dXJxdW9pc2VcIjogWzY0LCAyMjQsIDIwOF0sXHJcblx0XCJ2aW9sZXRcIjogWzIzOCwgMTMwLCAyMzhdLFxyXG5cdFwid2hlYXRcIjogWzI0NSwgMjIyLCAxNzldLFxyXG5cdFwid2hpdGVcIjogWzI1NSwgMjU1LCAyNTVdLFxyXG5cdFwid2hpdGVzbW9rZVwiOiBbMjQ1LCAyNDUsIDI0NV0sXHJcblx0XCJ5ZWxsb3dcIjogWzI1NSwgMjU1LCAwXSxcclxuXHRcInllbGxvd2dyZWVuXCI6IFsxNTQsIDIwNSwgNTBdXHJcbn07XHJcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIG1hdGNoT3BlcmF0b3JzUmUgPSAvW3xcXFxce30oKVtcXF1eJCsqPy5dL2c7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKHN0cikge1xuXHRpZiAodHlwZW9mIHN0ciAhPT0gJ3N0cmluZycpIHtcblx0XHR0aHJvdyBuZXcgVHlwZUVycm9yKCdFeHBlY3RlZCBhIHN0cmluZycpO1xuXHR9XG5cblx0cmV0dXJuIHN0ci5yZXBsYWNlKG1hdGNoT3BlcmF0b3JzUmUsICdcXFxcJCYnKTtcbn07XG4iLCIndXNlIHN0cmljdCdcblxuY29uc3QgZnMgPSByZXF1aXJlKCdncmFjZWZ1bC1mcycpXG5jb25zdCBwYXRoID0gcmVxdWlyZSgncGF0aCcpXG5jb25zdCBta2RpcnNTeW5jID0gcmVxdWlyZSgnLi4vbWtkaXJzJykubWtkaXJzU3luY1xuY29uc3QgdXRpbWVzTWlsbGlzU3luYyA9IHJlcXVpcmUoJy4uL3V0aWwvdXRpbWVzJykudXRpbWVzTWlsbGlzU3luY1xuY29uc3Qgc3RhdCA9IHJlcXVpcmUoJy4uL3V0aWwvc3RhdCcpXG5cbmZ1bmN0aW9uIGNvcHlTeW5jIChzcmMsIGRlc3QsIG9wdHMpIHtcbiAgaWYgKHR5cGVvZiBvcHRzID09PSAnZnVuY3Rpb24nKSB7XG4gICAgb3B0cyA9IHsgZmlsdGVyOiBvcHRzIH1cbiAgfVxuXG4gIG9wdHMgPSBvcHRzIHx8IHt9XG4gIG9wdHMuY2xvYmJlciA9ICdjbG9iYmVyJyBpbiBvcHRzID8gISFvcHRzLmNsb2JiZXIgOiB0cnVlIC8vIGRlZmF1bHQgdG8gdHJ1ZSBmb3Igbm93XG4gIG9wdHMub3ZlcndyaXRlID0gJ292ZXJ3cml0ZScgaW4gb3B0cyA/ICEhb3B0cy5vdmVyd3JpdGUgOiBvcHRzLmNsb2JiZXIgLy8gb3ZlcndyaXRlIGZhbGxzIGJhY2sgdG8gY2xvYmJlclxuXG4gIC8vIFdhcm4gYWJvdXQgdXNpbmcgcHJlc2VydmVUaW1lc3RhbXBzIG9uIDMyLWJpdCBub2RlXG4gIGlmIChvcHRzLnByZXNlcnZlVGltZXN0YW1wcyAmJiBwcm9jZXNzLmFyY2ggPT09ICdpYTMyJykge1xuICAgIHByb2Nlc3MuZW1pdFdhcm5pbmcoXG4gICAgICAnVXNpbmcgdGhlIHByZXNlcnZlVGltZXN0YW1wcyBvcHRpb24gaW4gMzItYml0IG5vZGUgaXMgbm90IHJlY29tbWVuZGVkO1xcblxcbicgK1xuICAgICAgJ1xcdHNlZSBodHRwczovL2dpdGh1Yi5jb20vanByaWNoYXJkc29uL25vZGUtZnMtZXh0cmEvaXNzdWVzLzI2OScsXG4gICAgICAnV2FybmluZycsICdmcy1leHRyYS1XQVJOMDAwMidcbiAgICApXG4gIH1cblxuICBjb25zdCB7IHNyY1N0YXQsIGRlc3RTdGF0IH0gPSBzdGF0LmNoZWNrUGF0aHNTeW5jKHNyYywgZGVzdCwgJ2NvcHknLCBvcHRzKVxuICBzdGF0LmNoZWNrUGFyZW50UGF0aHNTeW5jKHNyYywgc3JjU3RhdCwgZGVzdCwgJ2NvcHknKVxuICByZXR1cm4gaGFuZGxlRmlsdGVyQW5kQ29weShkZXN0U3RhdCwgc3JjLCBkZXN0LCBvcHRzKVxufVxuXG5mdW5jdGlvbiBoYW5kbGVGaWx0ZXJBbmRDb3B5IChkZXN0U3RhdCwgc3JjLCBkZXN0LCBvcHRzKSB7XG4gIGlmIChvcHRzLmZpbHRlciAmJiAhb3B0cy5maWx0ZXIoc3JjLCBkZXN0KSkgcmV0dXJuXG4gIGNvbnN0IGRlc3RQYXJlbnQgPSBwYXRoLmRpcm5hbWUoZGVzdClcbiAgaWYgKCFmcy5leGlzdHNTeW5jKGRlc3RQYXJlbnQpKSBta2RpcnNTeW5jKGRlc3RQYXJlbnQpXG4gIHJldHVybiBnZXRTdGF0cyhkZXN0U3RhdCwgc3JjLCBkZXN0LCBvcHRzKVxufVxuXG5mdW5jdGlvbiBzdGFydENvcHkgKGRlc3RTdGF0LCBzcmMsIGRlc3QsIG9wdHMpIHtcbiAgaWYgKG9wdHMuZmlsdGVyICYmICFvcHRzLmZpbHRlcihzcmMsIGRlc3QpKSByZXR1cm5cbiAgcmV0dXJuIGdldFN0YXRzKGRlc3RTdGF0LCBzcmMsIGRlc3QsIG9wdHMpXG59XG5cbmZ1bmN0aW9uIGdldFN0YXRzIChkZXN0U3RhdCwgc3JjLCBkZXN0LCBvcHRzKSB7XG4gIGNvbnN0IHN0YXRTeW5jID0gb3B0cy5kZXJlZmVyZW5jZSA/IGZzLnN0YXRTeW5jIDogZnMubHN0YXRTeW5jXG4gIGNvbnN0IHNyY1N0YXQgPSBzdGF0U3luYyhzcmMpXG5cbiAgaWYgKHNyY1N0YXQuaXNEaXJlY3RvcnkoKSkgcmV0dXJuIG9uRGlyKHNyY1N0YXQsIGRlc3RTdGF0LCBzcmMsIGRlc3QsIG9wdHMpXG4gIGVsc2UgaWYgKHNyY1N0YXQuaXNGaWxlKCkgfHxcbiAgICAgICAgICAgc3JjU3RhdC5pc0NoYXJhY3RlckRldmljZSgpIHx8XG4gICAgICAgICAgIHNyY1N0YXQuaXNCbG9ja0RldmljZSgpKSByZXR1cm4gb25GaWxlKHNyY1N0YXQsIGRlc3RTdGF0LCBzcmMsIGRlc3QsIG9wdHMpXG4gIGVsc2UgaWYgKHNyY1N0YXQuaXNTeW1ib2xpY0xpbmsoKSkgcmV0dXJuIG9uTGluayhkZXN0U3RhdCwgc3JjLCBkZXN0LCBvcHRzKVxuICBlbHNlIGlmIChzcmNTdGF0LmlzU29ja2V0KCkpIHRocm93IG5ldyBFcnJvcihgQ2Fubm90IGNvcHkgYSBzb2NrZXQgZmlsZTogJHtzcmN9YClcbiAgZWxzZSBpZiAoc3JjU3RhdC5pc0ZJRk8oKSkgdGhyb3cgbmV3IEVycm9yKGBDYW5ub3QgY29weSBhIEZJRk8gcGlwZTogJHtzcmN9YClcbiAgdGhyb3cgbmV3IEVycm9yKGBVbmtub3duIGZpbGU6ICR7c3JjfWApXG59XG5cbmZ1bmN0aW9uIG9uRmlsZSAoc3JjU3RhdCwgZGVzdFN0YXQsIHNyYywgZGVzdCwgb3B0cykge1xuICBpZiAoIWRlc3RTdGF0KSByZXR1cm4gY29weUZpbGUoc3JjU3RhdCwgc3JjLCBkZXN0LCBvcHRzKVxuICByZXR1cm4gbWF5Q29weUZpbGUoc3JjU3RhdCwgc3JjLCBkZXN0LCBvcHRzKVxufVxuXG5mdW5jdGlvbiBtYXlDb3B5RmlsZSAoc3JjU3RhdCwgc3JjLCBkZXN0LCBvcHRzKSB7XG4gIGlmIChvcHRzLm92ZXJ3cml0ZSkge1xuICAgIGZzLnVubGlua1N5bmMoZGVzdClcbiAgICByZXR1cm4gY29weUZpbGUoc3JjU3RhdCwgc3JjLCBkZXN0LCBvcHRzKVxuICB9IGVsc2UgaWYgKG9wdHMuZXJyb3JPbkV4aXN0KSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGAnJHtkZXN0fScgYWxyZWFkeSBleGlzdHNgKVxuICB9XG59XG5cbmZ1bmN0aW9uIGNvcHlGaWxlIChzcmNTdGF0LCBzcmMsIGRlc3QsIG9wdHMpIHtcbiAgZnMuY29weUZpbGVTeW5jKHNyYywgZGVzdClcbiAgaWYgKG9wdHMucHJlc2VydmVUaW1lc3RhbXBzKSBoYW5kbGVUaW1lc3RhbXBzKHNyY1N0YXQubW9kZSwgc3JjLCBkZXN0KVxuICByZXR1cm4gc2V0RGVzdE1vZGUoZGVzdCwgc3JjU3RhdC5tb2RlKVxufVxuXG5mdW5jdGlvbiBoYW5kbGVUaW1lc3RhbXBzIChzcmNNb2RlLCBzcmMsIGRlc3QpIHtcbiAgLy8gTWFrZSBzdXJlIHRoZSBmaWxlIGlzIHdyaXRhYmxlIGJlZm9yZSBzZXR0aW5nIHRoZSB0aW1lc3RhbXBcbiAgLy8gb3RoZXJ3aXNlIG9wZW4gZmFpbHMgd2l0aCBFUEVSTSB3aGVuIGludm9rZWQgd2l0aCAncisnXG4gIC8vICh0aHJvdWdoIHV0aW1lcyBjYWxsKVxuICBpZiAoZmlsZUlzTm90V3JpdGFibGUoc3JjTW9kZSkpIG1ha2VGaWxlV3JpdGFibGUoZGVzdCwgc3JjTW9kZSlcbiAgcmV0dXJuIHNldERlc3RUaW1lc3RhbXBzKHNyYywgZGVzdClcbn1cblxuZnVuY3Rpb24gZmlsZUlzTm90V3JpdGFibGUgKHNyY01vZGUpIHtcbiAgcmV0dXJuIChzcmNNb2RlICYgMG8yMDApID09PSAwXG59XG5cbmZ1bmN0aW9uIG1ha2VGaWxlV3JpdGFibGUgKGRlc3QsIHNyY01vZGUpIHtcbiAgcmV0dXJuIHNldERlc3RNb2RlKGRlc3QsIHNyY01vZGUgfCAwbzIwMClcbn1cblxuZnVuY3Rpb24gc2V0RGVzdE1vZGUgKGRlc3QsIHNyY01vZGUpIHtcbiAgcmV0dXJuIGZzLmNobW9kU3luYyhkZXN0LCBzcmNNb2RlKVxufVxuXG5mdW5jdGlvbiBzZXREZXN0VGltZXN0YW1wcyAoc3JjLCBkZXN0KSB7XG4gIC8vIFRoZSBpbml0aWFsIHNyY1N0YXQuYXRpbWUgY2Fubm90IGJlIHRydXN0ZWRcbiAgLy8gYmVjYXVzZSBpdCBpcyBtb2RpZmllZCBieSB0aGUgcmVhZCgyKSBzeXN0ZW0gY2FsbFxuICAvLyAoU2VlIGh0dHBzOi8vbm9kZWpzLm9yZy9hcGkvZnMuaHRtbCNmc19zdGF0X3RpbWVfdmFsdWVzKVxuICBjb25zdCB1cGRhdGVkU3JjU3RhdCA9IGZzLnN0YXRTeW5jKHNyYylcbiAgcmV0dXJuIHV0aW1lc01pbGxpc1N5bmMoZGVzdCwgdXBkYXRlZFNyY1N0YXQuYXRpbWUsIHVwZGF0ZWRTcmNTdGF0Lm10aW1lKVxufVxuXG5mdW5jdGlvbiBvbkRpciAoc3JjU3RhdCwgZGVzdFN0YXQsIHNyYywgZGVzdCwgb3B0cykge1xuICBpZiAoIWRlc3RTdGF0KSByZXR1cm4gbWtEaXJBbmRDb3B5KHNyY1N0YXQubW9kZSwgc3JjLCBkZXN0LCBvcHRzKVxuICByZXR1cm4gY29weURpcihzcmMsIGRlc3QsIG9wdHMpXG59XG5cbmZ1bmN0aW9uIG1rRGlyQW5kQ29weSAoc3JjTW9kZSwgc3JjLCBkZXN0LCBvcHRzKSB7XG4gIGZzLm1rZGlyU3luYyhkZXN0KVxuICBjb3B5RGlyKHNyYywgZGVzdCwgb3B0cylcbiAgcmV0dXJuIHNldERlc3RNb2RlKGRlc3QsIHNyY01vZGUpXG59XG5cbmZ1bmN0aW9uIGNvcHlEaXIgKHNyYywgZGVzdCwgb3B0cykge1xuICBmcy5yZWFkZGlyU3luYyhzcmMpLmZvckVhY2goaXRlbSA9PiBjb3B5RGlySXRlbShpdGVtLCBzcmMsIGRlc3QsIG9wdHMpKVxufVxuXG5mdW5jdGlvbiBjb3B5RGlySXRlbSAoaXRlbSwgc3JjLCBkZXN0LCBvcHRzKSB7XG4gIGNvbnN0IHNyY0l0ZW0gPSBwYXRoLmpvaW4oc3JjLCBpdGVtKVxuICBjb25zdCBkZXN0SXRlbSA9IHBhdGguam9pbihkZXN0LCBpdGVtKVxuICBjb25zdCB7IGRlc3RTdGF0IH0gPSBzdGF0LmNoZWNrUGF0aHNTeW5jKHNyY0l0ZW0sIGRlc3RJdGVtLCAnY29weScsIG9wdHMpXG4gIHJldHVybiBzdGFydENvcHkoZGVzdFN0YXQsIHNyY0l0ZW0sIGRlc3RJdGVtLCBvcHRzKVxufVxuXG5mdW5jdGlvbiBvbkxpbmsgKGRlc3RTdGF0LCBzcmMsIGRlc3QsIG9wdHMpIHtcbiAgbGV0IHJlc29sdmVkU3JjID0gZnMucmVhZGxpbmtTeW5jKHNyYylcbiAgaWYgKG9wdHMuZGVyZWZlcmVuY2UpIHtcbiAgICByZXNvbHZlZFNyYyA9IHBhdGgucmVzb2x2ZShwcm9jZXNzLmN3ZCgpLCByZXNvbHZlZFNyYylcbiAgfVxuXG4gIGlmICghZGVzdFN0YXQpIHtcbiAgICByZXR1cm4gZnMuc3ltbGlua1N5bmMocmVzb2x2ZWRTcmMsIGRlc3QpXG4gIH0gZWxzZSB7XG4gICAgbGV0IHJlc29sdmVkRGVzdFxuICAgIHRyeSB7XG4gICAgICByZXNvbHZlZERlc3QgPSBmcy5yZWFkbGlua1N5bmMoZGVzdClcbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgIC8vIGRlc3QgZXhpc3RzIGFuZCBpcyBhIHJlZ3VsYXIgZmlsZSBvciBkaXJlY3RvcnksXG4gICAgICAvLyBXaW5kb3dzIG1heSB0aHJvdyBVTktOT1dOIGVycm9yLiBJZiBkZXN0IGFscmVhZHkgZXhpc3RzLFxuICAgICAgLy8gZnMgdGhyb3dzIGVycm9yIGFueXdheSwgc28gbm8gbmVlZCB0byBndWFyZCBhZ2FpbnN0IGl0IGhlcmUuXG4gICAgICBpZiAoZXJyLmNvZGUgPT09ICdFSU5WQUwnIHx8IGVyci5jb2RlID09PSAnVU5LTk9XTicpIHJldHVybiBmcy5zeW1saW5rU3luYyhyZXNvbHZlZFNyYywgZGVzdClcbiAgICAgIHRocm93IGVyclxuICAgIH1cbiAgICBpZiAob3B0cy5kZXJlZmVyZW5jZSkge1xuICAgICAgcmVzb2x2ZWREZXN0ID0gcGF0aC5yZXNvbHZlKHByb2Nlc3MuY3dkKCksIHJlc29sdmVkRGVzdClcbiAgICB9XG4gICAgaWYgKHN0YXQuaXNTcmNTdWJkaXIocmVzb2x2ZWRTcmMsIHJlc29sdmVkRGVzdCkpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgQ2Fubm90IGNvcHkgJyR7cmVzb2x2ZWRTcmN9JyB0byBhIHN1YmRpcmVjdG9yeSBvZiBpdHNlbGYsICcke3Jlc29sdmVkRGVzdH0nLmApXG4gICAgfVxuXG4gICAgLy8gcHJldmVudCBjb3B5IGlmIHNyYyBpcyBhIHN1YmRpciBvZiBkZXN0IHNpbmNlIHVubGlua2luZ1xuICAgIC8vIGRlc3QgaW4gdGhpcyBjYXNlIHdvdWxkIHJlc3VsdCBpbiByZW1vdmluZyBzcmMgY29udGVudHNcbiAgICAvLyBhbmQgdGhlcmVmb3JlIGEgYnJva2VuIHN5bWxpbmsgd291bGQgYmUgY3JlYXRlZC5cbiAgICBpZiAoZnMuc3RhdFN5bmMoZGVzdCkuaXNEaXJlY3RvcnkoKSAmJiBzdGF0LmlzU3JjU3ViZGlyKHJlc29sdmVkRGVzdCwgcmVzb2x2ZWRTcmMpKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYENhbm5vdCBvdmVyd3JpdGUgJyR7cmVzb2x2ZWREZXN0fScgd2l0aCAnJHtyZXNvbHZlZFNyY30nLmApXG4gICAgfVxuICAgIHJldHVybiBjb3B5TGluayhyZXNvbHZlZFNyYywgZGVzdClcbiAgfVxufVxuXG5mdW5jdGlvbiBjb3B5TGluayAocmVzb2x2ZWRTcmMsIGRlc3QpIHtcbiAgZnMudW5saW5rU3luYyhkZXN0KVxuICByZXR1cm4gZnMuc3ltbGlua1N5bmMocmVzb2x2ZWRTcmMsIGRlc3QpXG59XG5cbm1vZHVsZS5leHBvcnRzID0gY29weVN5bmNcbiIsIid1c2Ugc3RyaWN0J1xuXG5jb25zdCBmcyA9IHJlcXVpcmUoJ2dyYWNlZnVsLWZzJylcbmNvbnN0IHBhdGggPSByZXF1aXJlKCdwYXRoJylcbmNvbnN0IG1rZGlycyA9IHJlcXVpcmUoJy4uL21rZGlycycpLm1rZGlyc1xuY29uc3QgcGF0aEV4aXN0cyA9IHJlcXVpcmUoJy4uL3BhdGgtZXhpc3RzJykucGF0aEV4aXN0c1xuY29uc3QgdXRpbWVzTWlsbGlzID0gcmVxdWlyZSgnLi4vdXRpbC91dGltZXMnKS51dGltZXNNaWxsaXNcbmNvbnN0IHN0YXQgPSByZXF1aXJlKCcuLi91dGlsL3N0YXQnKVxuXG5mdW5jdGlvbiBjb3B5IChzcmMsIGRlc3QsIG9wdHMsIGNiKSB7XG4gIGlmICh0eXBlb2Ygb3B0cyA9PT0gJ2Z1bmN0aW9uJyAmJiAhY2IpIHtcbiAgICBjYiA9IG9wdHNcbiAgICBvcHRzID0ge31cbiAgfSBlbHNlIGlmICh0eXBlb2Ygb3B0cyA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIG9wdHMgPSB7IGZpbHRlcjogb3B0cyB9XG4gIH1cblxuICBjYiA9IGNiIHx8IGZ1bmN0aW9uICgpIHt9XG4gIG9wdHMgPSBvcHRzIHx8IHt9XG5cbiAgb3B0cy5jbG9iYmVyID0gJ2Nsb2JiZXInIGluIG9wdHMgPyAhIW9wdHMuY2xvYmJlciA6IHRydWUgLy8gZGVmYXVsdCB0byB0cnVlIGZvciBub3dcbiAgb3B0cy5vdmVyd3JpdGUgPSAnb3ZlcndyaXRlJyBpbiBvcHRzID8gISFvcHRzLm92ZXJ3cml0ZSA6IG9wdHMuY2xvYmJlciAvLyBvdmVyd3JpdGUgZmFsbHMgYmFjayB0byBjbG9iYmVyXG5cbiAgLy8gV2FybiBhYm91dCB1c2luZyBwcmVzZXJ2ZVRpbWVzdGFtcHMgb24gMzItYml0IG5vZGVcbiAgaWYgKG9wdHMucHJlc2VydmVUaW1lc3RhbXBzICYmIHByb2Nlc3MuYXJjaCA9PT0gJ2lhMzInKSB7XG4gICAgcHJvY2Vzcy5lbWl0V2FybmluZyhcbiAgICAgICdVc2luZyB0aGUgcHJlc2VydmVUaW1lc3RhbXBzIG9wdGlvbiBpbiAzMi1iaXQgbm9kZSBpcyBub3QgcmVjb21tZW5kZWQ7XFxuXFxuJyArXG4gICAgICAnXFx0c2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9qcHJpY2hhcmRzb24vbm9kZS1mcy1leHRyYS9pc3N1ZXMvMjY5JyxcbiAgICAgICdXYXJuaW5nJywgJ2ZzLWV4dHJhLVdBUk4wMDAxJ1xuICAgIClcbiAgfVxuXG4gIHN0YXQuY2hlY2tQYXRocyhzcmMsIGRlc3QsICdjb3B5Jywgb3B0cywgKGVyciwgc3RhdHMpID0+IHtcbiAgICBpZiAoZXJyKSByZXR1cm4gY2IoZXJyKVxuICAgIGNvbnN0IHsgc3JjU3RhdCwgZGVzdFN0YXQgfSA9IHN0YXRzXG4gICAgc3RhdC5jaGVja1BhcmVudFBhdGhzKHNyYywgc3JjU3RhdCwgZGVzdCwgJ2NvcHknLCBlcnIgPT4ge1xuICAgICAgaWYgKGVycikgcmV0dXJuIGNiKGVycilcbiAgICAgIGlmIChvcHRzLmZpbHRlcikgcmV0dXJuIGhhbmRsZUZpbHRlcihjaGVja1BhcmVudERpciwgZGVzdFN0YXQsIHNyYywgZGVzdCwgb3B0cywgY2IpXG4gICAgICByZXR1cm4gY2hlY2tQYXJlbnREaXIoZGVzdFN0YXQsIHNyYywgZGVzdCwgb3B0cywgY2IpXG4gICAgfSlcbiAgfSlcbn1cblxuZnVuY3Rpb24gY2hlY2tQYXJlbnREaXIgKGRlc3RTdGF0LCBzcmMsIGRlc3QsIG9wdHMsIGNiKSB7XG4gIGNvbnN0IGRlc3RQYXJlbnQgPSBwYXRoLmRpcm5hbWUoZGVzdClcbiAgcGF0aEV4aXN0cyhkZXN0UGFyZW50LCAoZXJyLCBkaXJFeGlzdHMpID0+IHtcbiAgICBpZiAoZXJyKSByZXR1cm4gY2IoZXJyKVxuICAgIGlmIChkaXJFeGlzdHMpIHJldHVybiBnZXRTdGF0cyhkZXN0U3RhdCwgc3JjLCBkZXN0LCBvcHRzLCBjYilcbiAgICBta2RpcnMoZGVzdFBhcmVudCwgZXJyID0+IHtcbiAgICAgIGlmIChlcnIpIHJldHVybiBjYihlcnIpXG4gICAgICByZXR1cm4gZ2V0U3RhdHMoZGVzdFN0YXQsIHNyYywgZGVzdCwgb3B0cywgY2IpXG4gICAgfSlcbiAgfSlcbn1cblxuZnVuY3Rpb24gaGFuZGxlRmlsdGVyIChvbkluY2x1ZGUsIGRlc3RTdGF0LCBzcmMsIGRlc3QsIG9wdHMsIGNiKSB7XG4gIFByb21pc2UucmVzb2x2ZShvcHRzLmZpbHRlcihzcmMsIGRlc3QpKS50aGVuKGluY2x1ZGUgPT4ge1xuICAgIGlmIChpbmNsdWRlKSByZXR1cm4gb25JbmNsdWRlKGRlc3RTdGF0LCBzcmMsIGRlc3QsIG9wdHMsIGNiKVxuICAgIHJldHVybiBjYigpXG4gIH0sIGVycm9yID0+IGNiKGVycm9yKSlcbn1cblxuZnVuY3Rpb24gc3RhcnRDb3B5IChkZXN0U3RhdCwgc3JjLCBkZXN0LCBvcHRzLCBjYikge1xuICBpZiAob3B0cy5maWx0ZXIpIHJldHVybiBoYW5kbGVGaWx0ZXIoZ2V0U3RhdHMsIGRlc3RTdGF0LCBzcmMsIGRlc3QsIG9wdHMsIGNiKVxuICByZXR1cm4gZ2V0U3RhdHMoZGVzdFN0YXQsIHNyYywgZGVzdCwgb3B0cywgY2IpXG59XG5cbmZ1bmN0aW9uIGdldFN0YXRzIChkZXN0U3RhdCwgc3JjLCBkZXN0LCBvcHRzLCBjYikge1xuICBjb25zdCBzdGF0ID0gb3B0cy5kZXJlZmVyZW5jZSA/IGZzLnN0YXQgOiBmcy5sc3RhdFxuICBzdGF0KHNyYywgKGVyciwgc3JjU3RhdCkgPT4ge1xuICAgIGlmIChlcnIpIHJldHVybiBjYihlcnIpXG5cbiAgICBpZiAoc3JjU3RhdC5pc0RpcmVjdG9yeSgpKSByZXR1cm4gb25EaXIoc3JjU3RhdCwgZGVzdFN0YXQsIHNyYywgZGVzdCwgb3B0cywgY2IpXG4gICAgZWxzZSBpZiAoc3JjU3RhdC5pc0ZpbGUoKSB8fFxuICAgICAgICAgICAgIHNyY1N0YXQuaXNDaGFyYWN0ZXJEZXZpY2UoKSB8fFxuICAgICAgICAgICAgIHNyY1N0YXQuaXNCbG9ja0RldmljZSgpKSByZXR1cm4gb25GaWxlKHNyY1N0YXQsIGRlc3RTdGF0LCBzcmMsIGRlc3QsIG9wdHMsIGNiKVxuICAgIGVsc2UgaWYgKHNyY1N0YXQuaXNTeW1ib2xpY0xpbmsoKSkgcmV0dXJuIG9uTGluayhkZXN0U3RhdCwgc3JjLCBkZXN0LCBvcHRzLCBjYilcbiAgICBlbHNlIGlmIChzcmNTdGF0LmlzU29ja2V0KCkpIHJldHVybiBjYihuZXcgRXJyb3IoYENhbm5vdCBjb3B5IGEgc29ja2V0IGZpbGU6ICR7c3JjfWApKVxuICAgIGVsc2UgaWYgKHNyY1N0YXQuaXNGSUZPKCkpIHJldHVybiBjYihuZXcgRXJyb3IoYENhbm5vdCBjb3B5IGEgRklGTyBwaXBlOiAke3NyY31gKSlcbiAgICByZXR1cm4gY2IobmV3IEVycm9yKGBVbmtub3duIGZpbGU6ICR7c3JjfWApKVxuICB9KVxufVxuXG5mdW5jdGlvbiBvbkZpbGUgKHNyY1N0YXQsIGRlc3RTdGF0LCBzcmMsIGRlc3QsIG9wdHMsIGNiKSB7XG4gIGlmICghZGVzdFN0YXQpIHJldHVybiBjb3B5RmlsZShzcmNTdGF0LCBzcmMsIGRlc3QsIG9wdHMsIGNiKVxuICByZXR1cm4gbWF5Q29weUZpbGUoc3JjU3RhdCwgc3JjLCBkZXN0LCBvcHRzLCBjYilcbn1cblxuZnVuY3Rpb24gbWF5Q29weUZpbGUgKHNyY1N0YXQsIHNyYywgZGVzdCwgb3B0cywgY2IpIHtcbiAgaWYgKG9wdHMub3ZlcndyaXRlKSB7XG4gICAgZnMudW5saW5rKGRlc3QsIGVyciA9PiB7XG4gICAgICBpZiAoZXJyKSByZXR1cm4gY2IoZXJyKVxuICAgICAgcmV0dXJuIGNvcHlGaWxlKHNyY1N0YXQsIHNyYywgZGVzdCwgb3B0cywgY2IpXG4gICAgfSlcbiAgfSBlbHNlIGlmIChvcHRzLmVycm9yT25FeGlzdCkge1xuICAgIHJldHVybiBjYihuZXcgRXJyb3IoYCcke2Rlc3R9JyBhbHJlYWR5IGV4aXN0c2ApKVxuICB9IGVsc2UgcmV0dXJuIGNiKClcbn1cblxuZnVuY3Rpb24gY29weUZpbGUgKHNyY1N0YXQsIHNyYywgZGVzdCwgb3B0cywgY2IpIHtcbiAgZnMuY29weUZpbGUoc3JjLCBkZXN0LCBlcnIgPT4ge1xuICAgIGlmIChlcnIpIHJldHVybiBjYihlcnIpXG4gICAgaWYgKG9wdHMucHJlc2VydmVUaW1lc3RhbXBzKSByZXR1cm4gaGFuZGxlVGltZXN0YW1wc0FuZE1vZGUoc3JjU3RhdC5tb2RlLCBzcmMsIGRlc3QsIGNiKVxuICAgIHJldHVybiBzZXREZXN0TW9kZShkZXN0LCBzcmNTdGF0Lm1vZGUsIGNiKVxuICB9KVxufVxuXG5mdW5jdGlvbiBoYW5kbGVUaW1lc3RhbXBzQW5kTW9kZSAoc3JjTW9kZSwgc3JjLCBkZXN0LCBjYikge1xuICAvLyBNYWtlIHN1cmUgdGhlIGZpbGUgaXMgd3JpdGFibGUgYmVmb3JlIHNldHRpbmcgdGhlIHRpbWVzdGFtcFxuICAvLyBvdGhlcndpc2Ugb3BlbiBmYWlscyB3aXRoIEVQRVJNIHdoZW4gaW52b2tlZCB3aXRoICdyKydcbiAgLy8gKHRocm91Z2ggdXRpbWVzIGNhbGwpXG4gIGlmIChmaWxlSXNOb3RXcml0YWJsZShzcmNNb2RlKSkge1xuICAgIHJldHVybiBtYWtlRmlsZVdyaXRhYmxlKGRlc3QsIHNyY01vZGUsIGVyciA9PiB7XG4gICAgICBpZiAoZXJyKSByZXR1cm4gY2IoZXJyKVxuICAgICAgcmV0dXJuIHNldERlc3RUaW1lc3RhbXBzQW5kTW9kZShzcmNNb2RlLCBzcmMsIGRlc3QsIGNiKVxuICAgIH0pXG4gIH1cbiAgcmV0dXJuIHNldERlc3RUaW1lc3RhbXBzQW5kTW9kZShzcmNNb2RlLCBzcmMsIGRlc3QsIGNiKVxufVxuXG5mdW5jdGlvbiBmaWxlSXNOb3RXcml0YWJsZSAoc3JjTW9kZSkge1xuICByZXR1cm4gKHNyY01vZGUgJiAwbzIwMCkgPT09IDBcbn1cblxuZnVuY3Rpb24gbWFrZUZpbGVXcml0YWJsZSAoZGVzdCwgc3JjTW9kZSwgY2IpIHtcbiAgcmV0dXJuIHNldERlc3RNb2RlKGRlc3QsIHNyY01vZGUgfCAwbzIwMCwgY2IpXG59XG5cbmZ1bmN0aW9uIHNldERlc3RUaW1lc3RhbXBzQW5kTW9kZSAoc3JjTW9kZSwgc3JjLCBkZXN0LCBjYikge1xuICBzZXREZXN0VGltZXN0YW1wcyhzcmMsIGRlc3QsIGVyciA9PiB7XG4gICAgaWYgKGVycikgcmV0dXJuIGNiKGVycilcbiAgICByZXR1cm4gc2V0RGVzdE1vZGUoZGVzdCwgc3JjTW9kZSwgY2IpXG4gIH0pXG59XG5cbmZ1bmN0aW9uIHNldERlc3RNb2RlIChkZXN0LCBzcmNNb2RlLCBjYikge1xuICByZXR1cm4gZnMuY2htb2QoZGVzdCwgc3JjTW9kZSwgY2IpXG59XG5cbmZ1bmN0aW9uIHNldERlc3RUaW1lc3RhbXBzIChzcmMsIGRlc3QsIGNiKSB7XG4gIC8vIFRoZSBpbml0aWFsIHNyY1N0YXQuYXRpbWUgY2Fubm90IGJlIHRydXN0ZWRcbiAgLy8gYmVjYXVzZSBpdCBpcyBtb2RpZmllZCBieSB0aGUgcmVhZCgyKSBzeXN0ZW0gY2FsbFxuICAvLyAoU2VlIGh0dHBzOi8vbm9kZWpzLm9yZy9hcGkvZnMuaHRtbCNmc19zdGF0X3RpbWVfdmFsdWVzKVxuICBmcy5zdGF0KHNyYywgKGVyciwgdXBkYXRlZFNyY1N0YXQpID0+IHtcbiAgICBpZiAoZXJyKSByZXR1cm4gY2IoZXJyKVxuICAgIHJldHVybiB1dGltZXNNaWxsaXMoZGVzdCwgdXBkYXRlZFNyY1N0YXQuYXRpbWUsIHVwZGF0ZWRTcmNTdGF0Lm10aW1lLCBjYilcbiAgfSlcbn1cblxuZnVuY3Rpb24gb25EaXIgKHNyY1N0YXQsIGRlc3RTdGF0LCBzcmMsIGRlc3QsIG9wdHMsIGNiKSB7XG4gIGlmICghZGVzdFN0YXQpIHJldHVybiBta0RpckFuZENvcHkoc3JjU3RhdC5tb2RlLCBzcmMsIGRlc3QsIG9wdHMsIGNiKVxuICByZXR1cm4gY29weURpcihzcmMsIGRlc3QsIG9wdHMsIGNiKVxufVxuXG5mdW5jdGlvbiBta0RpckFuZENvcHkgKHNyY01vZGUsIHNyYywgZGVzdCwgb3B0cywgY2IpIHtcbiAgZnMubWtkaXIoZGVzdCwgZXJyID0+IHtcbiAgICBpZiAoZXJyKSByZXR1cm4gY2IoZXJyKVxuICAgIGNvcHlEaXIoc3JjLCBkZXN0LCBvcHRzLCBlcnIgPT4ge1xuICAgICAgaWYgKGVycikgcmV0dXJuIGNiKGVycilcbiAgICAgIHJldHVybiBzZXREZXN0TW9kZShkZXN0LCBzcmNNb2RlLCBjYilcbiAgICB9KVxuICB9KVxufVxuXG5mdW5jdGlvbiBjb3B5RGlyIChzcmMsIGRlc3QsIG9wdHMsIGNiKSB7XG4gIGZzLnJlYWRkaXIoc3JjLCAoZXJyLCBpdGVtcykgPT4ge1xuICAgIGlmIChlcnIpIHJldHVybiBjYihlcnIpXG4gICAgcmV0dXJuIGNvcHlEaXJJdGVtcyhpdGVtcywgc3JjLCBkZXN0LCBvcHRzLCBjYilcbiAgfSlcbn1cblxuZnVuY3Rpb24gY29weURpckl0ZW1zIChpdGVtcywgc3JjLCBkZXN0LCBvcHRzLCBjYikge1xuICBjb25zdCBpdGVtID0gaXRlbXMucG9wKClcbiAgaWYgKCFpdGVtKSByZXR1cm4gY2IoKVxuICByZXR1cm4gY29weURpckl0ZW0oaXRlbXMsIGl0ZW0sIHNyYywgZGVzdCwgb3B0cywgY2IpXG59XG5cbmZ1bmN0aW9uIGNvcHlEaXJJdGVtIChpdGVtcywgaXRlbSwgc3JjLCBkZXN0LCBvcHRzLCBjYikge1xuICBjb25zdCBzcmNJdGVtID0gcGF0aC5qb2luKHNyYywgaXRlbSlcbiAgY29uc3QgZGVzdEl0ZW0gPSBwYXRoLmpvaW4oZGVzdCwgaXRlbSlcbiAgc3RhdC5jaGVja1BhdGhzKHNyY0l0ZW0sIGRlc3RJdGVtLCAnY29weScsIG9wdHMsIChlcnIsIHN0YXRzKSA9PiB7XG4gICAgaWYgKGVycikgcmV0dXJuIGNiKGVycilcbiAgICBjb25zdCB7IGRlc3RTdGF0IH0gPSBzdGF0c1xuICAgIHN0YXJ0Q29weShkZXN0U3RhdCwgc3JjSXRlbSwgZGVzdEl0ZW0sIG9wdHMsIGVyciA9PiB7XG4gICAgICBpZiAoZXJyKSByZXR1cm4gY2IoZXJyKVxuICAgICAgcmV0dXJuIGNvcHlEaXJJdGVtcyhpdGVtcywgc3JjLCBkZXN0LCBvcHRzLCBjYilcbiAgICB9KVxuICB9KVxufVxuXG5mdW5jdGlvbiBvbkxpbmsgKGRlc3RTdGF0LCBzcmMsIGRlc3QsIG9wdHMsIGNiKSB7XG4gIGZzLnJlYWRsaW5rKHNyYywgKGVyciwgcmVzb2x2ZWRTcmMpID0+IHtcbiAgICBpZiAoZXJyKSByZXR1cm4gY2IoZXJyKVxuICAgIGlmIChvcHRzLmRlcmVmZXJlbmNlKSB7XG4gICAgICByZXNvbHZlZFNyYyA9IHBhdGgucmVzb2x2ZShwcm9jZXNzLmN3ZCgpLCByZXNvbHZlZFNyYylcbiAgICB9XG5cbiAgICBpZiAoIWRlc3RTdGF0KSB7XG4gICAgICByZXR1cm4gZnMuc3ltbGluayhyZXNvbHZlZFNyYywgZGVzdCwgY2IpXG4gICAgfSBlbHNlIHtcbiAgICAgIGZzLnJlYWRsaW5rKGRlc3QsIChlcnIsIHJlc29sdmVkRGVzdCkgPT4ge1xuICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgLy8gZGVzdCBleGlzdHMgYW5kIGlzIGEgcmVndWxhciBmaWxlIG9yIGRpcmVjdG9yeSxcbiAgICAgICAgICAvLyBXaW5kb3dzIG1heSB0aHJvdyBVTktOT1dOIGVycm9yLiBJZiBkZXN0IGFscmVhZHkgZXhpc3RzLFxuICAgICAgICAgIC8vIGZzIHRocm93cyBlcnJvciBhbnl3YXksIHNvIG5vIG5lZWQgdG8gZ3VhcmQgYWdhaW5zdCBpdCBoZXJlLlxuICAgICAgICAgIGlmIChlcnIuY29kZSA9PT0gJ0VJTlZBTCcgfHwgZXJyLmNvZGUgPT09ICdVTktOT1dOJykgcmV0dXJuIGZzLnN5bWxpbmsocmVzb2x2ZWRTcmMsIGRlc3QsIGNiKVxuICAgICAgICAgIHJldHVybiBjYihlcnIpXG4gICAgICAgIH1cbiAgICAgICAgaWYgKG9wdHMuZGVyZWZlcmVuY2UpIHtcbiAgICAgICAgICByZXNvbHZlZERlc3QgPSBwYXRoLnJlc29sdmUocHJvY2Vzcy5jd2QoKSwgcmVzb2x2ZWREZXN0KVxuICAgICAgICB9XG4gICAgICAgIGlmIChzdGF0LmlzU3JjU3ViZGlyKHJlc29sdmVkU3JjLCByZXNvbHZlZERlc3QpKSB7XG4gICAgICAgICAgcmV0dXJuIGNiKG5ldyBFcnJvcihgQ2Fubm90IGNvcHkgJyR7cmVzb2x2ZWRTcmN9JyB0byBhIHN1YmRpcmVjdG9yeSBvZiBpdHNlbGYsICcke3Jlc29sdmVkRGVzdH0nLmApKVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gZG8gbm90IGNvcHkgaWYgc3JjIGlzIGEgc3ViZGlyIG9mIGRlc3Qgc2luY2UgdW5saW5raW5nXG4gICAgICAgIC8vIGRlc3QgaW4gdGhpcyBjYXNlIHdvdWxkIHJlc3VsdCBpbiByZW1vdmluZyBzcmMgY29udGVudHNcbiAgICAgICAgLy8gYW5kIHRoZXJlZm9yZSBhIGJyb2tlbiBzeW1saW5rIHdvdWxkIGJlIGNyZWF0ZWQuXG4gICAgICAgIGlmIChkZXN0U3RhdC5pc0RpcmVjdG9yeSgpICYmIHN0YXQuaXNTcmNTdWJkaXIocmVzb2x2ZWREZXN0LCByZXNvbHZlZFNyYykpIHtcbiAgICAgICAgICByZXR1cm4gY2IobmV3IEVycm9yKGBDYW5ub3Qgb3ZlcndyaXRlICcke3Jlc29sdmVkRGVzdH0nIHdpdGggJyR7cmVzb2x2ZWRTcmN9Jy5gKSlcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gY29weUxpbmsocmVzb2x2ZWRTcmMsIGRlc3QsIGNiKVxuICAgICAgfSlcbiAgICB9XG4gIH0pXG59XG5cbmZ1bmN0aW9uIGNvcHlMaW5rIChyZXNvbHZlZFNyYywgZGVzdCwgY2IpIHtcbiAgZnMudW5saW5rKGRlc3QsIGVyciA9PiB7XG4gICAgaWYgKGVycikgcmV0dXJuIGNiKGVycilcbiAgICByZXR1cm4gZnMuc3ltbGluayhyZXNvbHZlZFNyYywgZGVzdCwgY2IpXG4gIH0pXG59XG5cbm1vZHVsZS5leHBvcnRzID0gY29weVxuIiwiJ3VzZSBzdHJpY3QnXG5cbmNvbnN0IHUgPSByZXF1aXJlKCd1bml2ZXJzYWxpZnknKS5mcm9tQ2FsbGJhY2tcbm1vZHVsZS5leHBvcnRzID0ge1xuICBjb3B5OiB1KHJlcXVpcmUoJy4vY29weScpKSxcbiAgY29weVN5bmM6IHJlcXVpcmUoJy4vY29weS1zeW5jJylcbn1cbiIsIid1c2Ugc3RyaWN0J1xuXG5jb25zdCB1ID0gcmVxdWlyZSgndW5pdmVyc2FsaWZ5JykuZnJvbVByb21pc2VcbmNvbnN0IGZzID0gcmVxdWlyZSgnLi4vZnMnKVxuY29uc3QgcGF0aCA9IHJlcXVpcmUoJ3BhdGgnKVxuY29uc3QgbWtkaXIgPSByZXF1aXJlKCcuLi9ta2RpcnMnKVxuY29uc3QgcmVtb3ZlID0gcmVxdWlyZSgnLi4vcmVtb3ZlJylcblxuY29uc3QgZW1wdHlEaXIgPSB1KGFzeW5jIGZ1bmN0aW9uIGVtcHR5RGlyIChkaXIpIHtcbiAgbGV0IGl0ZW1zXG4gIHRyeSB7XG4gICAgaXRlbXMgPSBhd2FpdCBmcy5yZWFkZGlyKGRpcilcbiAgfSBjYXRjaCB7XG4gICAgcmV0dXJuIG1rZGlyLm1rZGlycyhkaXIpXG4gIH1cblxuICByZXR1cm4gUHJvbWlzZS5hbGwoaXRlbXMubWFwKGl0ZW0gPT4gcmVtb3ZlLnJlbW92ZShwYXRoLmpvaW4oZGlyLCBpdGVtKSkpKVxufSlcblxuZnVuY3Rpb24gZW1wdHlEaXJTeW5jIChkaXIpIHtcbiAgbGV0IGl0ZW1zXG4gIHRyeSB7XG4gICAgaXRlbXMgPSBmcy5yZWFkZGlyU3luYyhkaXIpXG4gIH0gY2F0Y2gge1xuICAgIHJldHVybiBta2Rpci5ta2RpcnNTeW5jKGRpcilcbiAgfVxuXG4gIGl0ZW1zLmZvckVhY2goaXRlbSA9PiB7XG4gICAgaXRlbSA9IHBhdGguam9pbihkaXIsIGl0ZW0pXG4gICAgcmVtb3ZlLnJlbW92ZVN5bmMoaXRlbSlcbiAgfSlcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIGVtcHR5RGlyU3luYyxcbiAgZW1wdHlkaXJTeW5jOiBlbXB0eURpclN5bmMsXG4gIGVtcHR5RGlyLFxuICBlbXB0eWRpcjogZW1wdHlEaXJcbn1cbiIsIid1c2Ugc3RyaWN0J1xuXG5jb25zdCB1ID0gcmVxdWlyZSgndW5pdmVyc2FsaWZ5JykuZnJvbUNhbGxiYWNrXG5jb25zdCBwYXRoID0gcmVxdWlyZSgncGF0aCcpXG5jb25zdCBmcyA9IHJlcXVpcmUoJ2dyYWNlZnVsLWZzJylcbmNvbnN0IG1rZGlyID0gcmVxdWlyZSgnLi4vbWtkaXJzJylcblxuZnVuY3Rpb24gY3JlYXRlRmlsZSAoZmlsZSwgY2FsbGJhY2spIHtcbiAgZnVuY3Rpb24gbWFrZUZpbGUgKCkge1xuICAgIGZzLndyaXRlRmlsZShmaWxlLCAnJywgZXJyID0+IHtcbiAgICAgIGlmIChlcnIpIHJldHVybiBjYWxsYmFjayhlcnIpXG4gICAgICBjYWxsYmFjaygpXG4gICAgfSlcbiAgfVxuXG4gIGZzLnN0YXQoZmlsZSwgKGVyciwgc3RhdHMpID0+IHsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBoYW5kbGUtY2FsbGJhY2stZXJyXG4gICAgaWYgKCFlcnIgJiYgc3RhdHMuaXNGaWxlKCkpIHJldHVybiBjYWxsYmFjaygpXG4gICAgY29uc3QgZGlyID0gcGF0aC5kaXJuYW1lKGZpbGUpXG4gICAgZnMuc3RhdChkaXIsIChlcnIsIHN0YXRzKSA9PiB7XG4gICAgICBpZiAoZXJyKSB7XG4gICAgICAgIC8vIGlmIHRoZSBkaXJlY3RvcnkgZG9lc24ndCBleGlzdCwgbWFrZSBpdFxuICAgICAgICBpZiAoZXJyLmNvZGUgPT09ICdFTk9FTlQnKSB7XG4gICAgICAgICAgcmV0dXJuIG1rZGlyLm1rZGlycyhkaXIsIGVyciA9PiB7XG4gICAgICAgICAgICBpZiAoZXJyKSByZXR1cm4gY2FsbGJhY2soZXJyKVxuICAgICAgICAgICAgbWFrZUZpbGUoKVxuICAgICAgICAgIH0pXG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGNhbGxiYWNrKGVycilcbiAgICAgIH1cblxuICAgICAgaWYgKHN0YXRzLmlzRGlyZWN0b3J5KCkpIG1ha2VGaWxlKClcbiAgICAgIGVsc2Uge1xuICAgICAgICAvLyBwYXJlbnQgaXMgbm90IGEgZGlyZWN0b3J5XG4gICAgICAgIC8vIFRoaXMgaXMganVzdCB0byBjYXVzZSBhbiBpbnRlcm5hbCBFTk9URElSIGVycm9yIHRvIGJlIHRocm93blxuICAgICAgICBmcy5yZWFkZGlyKGRpciwgZXJyID0+IHtcbiAgICAgICAgICBpZiAoZXJyKSByZXR1cm4gY2FsbGJhY2soZXJyKVxuICAgICAgICB9KVxuICAgICAgfVxuICAgIH0pXG4gIH0pXG59XG5cbmZ1bmN0aW9uIGNyZWF0ZUZpbGVTeW5jIChmaWxlKSB7XG4gIGxldCBzdGF0c1xuICB0cnkge1xuICAgIHN0YXRzID0gZnMuc3RhdFN5bmMoZmlsZSlcbiAgfSBjYXRjaCB7fVxuICBpZiAoc3RhdHMgJiYgc3RhdHMuaXNGaWxlKCkpIHJldHVyblxuXG4gIGNvbnN0IGRpciA9IHBhdGguZGlybmFtZShmaWxlKVxuICB0cnkge1xuICAgIGlmICghZnMuc3RhdFN5bmMoZGlyKS5pc0RpcmVjdG9yeSgpKSB7XG4gICAgICAvLyBwYXJlbnQgaXMgbm90IGEgZGlyZWN0b3J5XG4gICAgICAvLyBUaGlzIGlzIGp1c3QgdG8gY2F1c2UgYW4gaW50ZXJuYWwgRU5PVERJUiBlcnJvciB0byBiZSB0aHJvd25cbiAgICAgIGZzLnJlYWRkaXJTeW5jKGRpcilcbiAgICB9XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIC8vIElmIHRoZSBzdGF0IGNhbGwgYWJvdmUgZmFpbGVkIGJlY2F1c2UgdGhlIGRpcmVjdG9yeSBkb2Vzbid0IGV4aXN0LCBjcmVhdGUgaXRcbiAgICBpZiAoZXJyICYmIGVyci5jb2RlID09PSAnRU5PRU5UJykgbWtkaXIubWtkaXJzU3luYyhkaXIpXG4gICAgZWxzZSB0aHJvdyBlcnJcbiAgfVxuXG4gIGZzLndyaXRlRmlsZVN5bmMoZmlsZSwgJycpXG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBjcmVhdGVGaWxlOiB1KGNyZWF0ZUZpbGUpLFxuICBjcmVhdGVGaWxlU3luY1xufVxuIiwiJ3VzZSBzdHJpY3QnXG5cbmNvbnN0IHsgY3JlYXRlRmlsZSwgY3JlYXRlRmlsZVN5bmMgfSA9IHJlcXVpcmUoJy4vZmlsZScpXG5jb25zdCB7IGNyZWF0ZUxpbmssIGNyZWF0ZUxpbmtTeW5jIH0gPSByZXF1aXJlKCcuL2xpbmsnKVxuY29uc3QgeyBjcmVhdGVTeW1saW5rLCBjcmVhdGVTeW1saW5rU3luYyB9ID0gcmVxdWlyZSgnLi9zeW1saW5rJylcblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIC8vIGZpbGVcbiAgY3JlYXRlRmlsZSxcbiAgY3JlYXRlRmlsZVN5bmMsXG4gIGVuc3VyZUZpbGU6IGNyZWF0ZUZpbGUsXG4gIGVuc3VyZUZpbGVTeW5jOiBjcmVhdGVGaWxlU3luYyxcbiAgLy8gbGlua1xuICBjcmVhdGVMaW5rLFxuICBjcmVhdGVMaW5rU3luYyxcbiAgZW5zdXJlTGluazogY3JlYXRlTGluayxcbiAgZW5zdXJlTGlua1N5bmM6IGNyZWF0ZUxpbmtTeW5jLFxuICAvLyBzeW1saW5rXG4gIGNyZWF0ZVN5bWxpbmssXG4gIGNyZWF0ZVN5bWxpbmtTeW5jLFxuICBlbnN1cmVTeW1saW5rOiBjcmVhdGVTeW1saW5rLFxuICBlbnN1cmVTeW1saW5rU3luYzogY3JlYXRlU3ltbGlua1N5bmNcbn1cbiIsIid1c2Ugc3RyaWN0J1xuXG5jb25zdCB1ID0gcmVxdWlyZSgndW5pdmVyc2FsaWZ5JykuZnJvbUNhbGxiYWNrXG5jb25zdCBwYXRoID0gcmVxdWlyZSgncGF0aCcpXG5jb25zdCBmcyA9IHJlcXVpcmUoJ2dyYWNlZnVsLWZzJylcbmNvbnN0IG1rZGlyID0gcmVxdWlyZSgnLi4vbWtkaXJzJylcbmNvbnN0IHBhdGhFeGlzdHMgPSByZXF1aXJlKCcuLi9wYXRoLWV4aXN0cycpLnBhdGhFeGlzdHNcbmNvbnN0IHsgYXJlSWRlbnRpY2FsIH0gPSByZXF1aXJlKCcuLi91dGlsL3N0YXQnKVxuXG5mdW5jdGlvbiBjcmVhdGVMaW5rIChzcmNwYXRoLCBkc3RwYXRoLCBjYWxsYmFjaykge1xuICBmdW5jdGlvbiBtYWtlTGluayAoc3JjcGF0aCwgZHN0cGF0aCkge1xuICAgIGZzLmxpbmsoc3JjcGF0aCwgZHN0cGF0aCwgZXJyID0+IHtcbiAgICAgIGlmIChlcnIpIHJldHVybiBjYWxsYmFjayhlcnIpXG4gICAgICBjYWxsYmFjayhudWxsKVxuICAgIH0pXG4gIH1cblxuICBmcy5sc3RhdChkc3RwYXRoLCAoXywgZHN0U3RhdCkgPT4ge1xuICAgIGZzLmxzdGF0KHNyY3BhdGgsIChlcnIsIHNyY1N0YXQpID0+IHtcbiAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgZXJyLm1lc3NhZ2UgPSBlcnIubWVzc2FnZS5yZXBsYWNlKCdsc3RhdCcsICdlbnN1cmVMaW5rJylcbiAgICAgICAgcmV0dXJuIGNhbGxiYWNrKGVycilcbiAgICAgIH1cbiAgICAgIGlmIChkc3RTdGF0ICYmIGFyZUlkZW50aWNhbChzcmNTdGF0LCBkc3RTdGF0KSkgcmV0dXJuIGNhbGxiYWNrKG51bGwpXG5cbiAgICAgIGNvbnN0IGRpciA9IHBhdGguZGlybmFtZShkc3RwYXRoKVxuICAgICAgcGF0aEV4aXN0cyhkaXIsIChlcnIsIGRpckV4aXN0cykgPT4ge1xuICAgICAgICBpZiAoZXJyKSByZXR1cm4gY2FsbGJhY2soZXJyKVxuICAgICAgICBpZiAoZGlyRXhpc3RzKSByZXR1cm4gbWFrZUxpbmsoc3JjcGF0aCwgZHN0cGF0aClcbiAgICAgICAgbWtkaXIubWtkaXJzKGRpciwgZXJyID0+IHtcbiAgICAgICAgICBpZiAoZXJyKSByZXR1cm4gY2FsbGJhY2soZXJyKVxuICAgICAgICAgIG1ha2VMaW5rKHNyY3BhdGgsIGRzdHBhdGgpXG4gICAgICAgIH0pXG4gICAgICB9KVxuICAgIH0pXG4gIH0pXG59XG5cbmZ1bmN0aW9uIGNyZWF0ZUxpbmtTeW5jIChzcmNwYXRoLCBkc3RwYXRoKSB7XG4gIGxldCBkc3RTdGF0XG4gIHRyeSB7XG4gICAgZHN0U3RhdCA9IGZzLmxzdGF0U3luYyhkc3RwYXRoKVxuICB9IGNhdGNoIHt9XG5cbiAgdHJ5IHtcbiAgICBjb25zdCBzcmNTdGF0ID0gZnMubHN0YXRTeW5jKHNyY3BhdGgpXG4gICAgaWYgKGRzdFN0YXQgJiYgYXJlSWRlbnRpY2FsKHNyY1N0YXQsIGRzdFN0YXQpKSByZXR1cm5cbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgZXJyLm1lc3NhZ2UgPSBlcnIubWVzc2FnZS5yZXBsYWNlKCdsc3RhdCcsICdlbnN1cmVMaW5rJylcbiAgICB0aHJvdyBlcnJcbiAgfVxuXG4gIGNvbnN0IGRpciA9IHBhdGguZGlybmFtZShkc3RwYXRoKVxuICBjb25zdCBkaXJFeGlzdHMgPSBmcy5leGlzdHNTeW5jKGRpcilcbiAgaWYgKGRpckV4aXN0cykgcmV0dXJuIGZzLmxpbmtTeW5jKHNyY3BhdGgsIGRzdHBhdGgpXG4gIG1rZGlyLm1rZGlyc1N5bmMoZGlyKVxuXG4gIHJldHVybiBmcy5saW5rU3luYyhzcmNwYXRoLCBkc3RwYXRoKVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgY3JlYXRlTGluazogdShjcmVhdGVMaW5rKSxcbiAgY3JlYXRlTGlua1N5bmNcbn1cbiIsIid1c2Ugc3RyaWN0J1xuXG5jb25zdCBwYXRoID0gcmVxdWlyZSgncGF0aCcpXG5jb25zdCBmcyA9IHJlcXVpcmUoJ2dyYWNlZnVsLWZzJylcbmNvbnN0IHBhdGhFeGlzdHMgPSByZXF1aXJlKCcuLi9wYXRoLWV4aXN0cycpLnBhdGhFeGlzdHNcblxuLyoqXG4gKiBGdW5jdGlvbiB0aGF0IHJldHVybnMgdHdvIHR5cGVzIG9mIHBhdGhzLCBvbmUgcmVsYXRpdmUgdG8gc3ltbGluaywgYW5kIG9uZVxuICogcmVsYXRpdmUgdG8gdGhlIGN1cnJlbnQgd29ya2luZyBkaXJlY3RvcnkuIENoZWNrcyBpZiBwYXRoIGlzIGFic29sdXRlIG9yXG4gKiByZWxhdGl2ZS4gSWYgdGhlIHBhdGggaXMgcmVsYXRpdmUsIHRoaXMgZnVuY3Rpb24gY2hlY2tzIGlmIHRoZSBwYXRoIGlzXG4gKiByZWxhdGl2ZSB0byBzeW1saW5rIG9yIHJlbGF0aXZlIHRvIGN1cnJlbnQgd29ya2luZyBkaXJlY3RvcnkuIFRoaXMgaXMgYW5cbiAqIGluaXRpYXRpdmUgdG8gZmluZCBhIHNtYXJ0ZXIgYHNyY3BhdGhgIHRvIHN1cHBseSB3aGVuIGJ1aWxkaW5nIHN5bWxpbmtzLlxuICogVGhpcyBhbGxvd3MgeW91IHRvIGRldGVybWluZSB3aGljaCBwYXRoIHRvIHVzZSBvdXQgb2Ygb25lIG9mIHRocmVlIHBvc3NpYmxlXG4gKiB0eXBlcyBvZiBzb3VyY2UgcGF0aHMuIFRoZSBmaXJzdCBpcyBhbiBhYnNvbHV0ZSBwYXRoLiBUaGlzIGlzIGRldGVjdGVkIGJ5XG4gKiBgcGF0aC5pc0Fic29sdXRlKClgLiBXaGVuIGFuIGFic29sdXRlIHBhdGggaXMgcHJvdmlkZWQsIGl0IGlzIGNoZWNrZWQgdG9cbiAqIHNlZSBpZiBpdCBleGlzdHMuIElmIGl0IGRvZXMgaXQncyB1c2VkLCBpZiBub3QgYW4gZXJyb3IgaXMgcmV0dXJuZWRcbiAqIChjYWxsYmFjaykvIHRocm93biAoc3luYykuIFRoZSBvdGhlciB0d28gb3B0aW9ucyBmb3IgYHNyY3BhdGhgIGFyZSBhXG4gKiByZWxhdGl2ZSB1cmwuIEJ5IGRlZmF1bHQgTm9kZSdzIGBmcy5zeW1saW5rYCB3b3JrcyBieSBjcmVhdGluZyBhIHN5bWxpbmtcbiAqIHVzaW5nIGBkc3RwYXRoYCBhbmQgZXhwZWN0cyB0aGUgYHNyY3BhdGhgIHRvIGJlIHJlbGF0aXZlIHRvIHRoZSBuZXdseVxuICogY3JlYXRlZCBzeW1saW5rLiBJZiB5b3UgcHJvdmlkZSBhIGBzcmNwYXRoYCB0aGF0IGRvZXMgbm90IGV4aXN0IG9uIHRoZSBmaWxlXG4gKiBzeXN0ZW0gaXQgcmVzdWx0cyBpbiBhIGJyb2tlbiBzeW1saW5rLiBUbyBtaW5pbWl6ZSB0aGlzLCB0aGUgZnVuY3Rpb25cbiAqIGNoZWNrcyB0byBzZWUgaWYgdGhlICdyZWxhdGl2ZSB0byBzeW1saW5rJyBzb3VyY2UgZmlsZSBleGlzdHMsIGFuZCBpZiBpdFxuICogZG9lcyBpdCB3aWxsIHVzZSBpdC4gSWYgaXQgZG9lcyBub3QsIGl0IGNoZWNrcyBpZiB0aGVyZSdzIGEgZmlsZSB0aGF0XG4gKiBleGlzdHMgdGhhdCBpcyByZWxhdGl2ZSB0byB0aGUgY3VycmVudCB3b3JraW5nIGRpcmVjdG9yeSwgaWYgZG9lcyBpdHMgdXNlZC5cbiAqIFRoaXMgcHJlc2VydmVzIHRoZSBleHBlY3RhdGlvbnMgb2YgdGhlIG9yaWdpbmFsIGZzLnN5bWxpbmsgc3BlYyBhbmQgYWRkc1xuICogdGhlIGFiaWxpdHkgdG8gcGFzcyBpbiBgcmVsYXRpdmUgdG8gY3VycmVudCB3b3JraW5nIGRpcmVjb3RyeWAgcGF0aHMuXG4gKi9cblxuZnVuY3Rpb24gc3ltbGlua1BhdGhzIChzcmNwYXRoLCBkc3RwYXRoLCBjYWxsYmFjaykge1xuICBpZiAocGF0aC5pc0Fic29sdXRlKHNyY3BhdGgpKSB7XG4gICAgcmV0dXJuIGZzLmxzdGF0KHNyY3BhdGgsIChlcnIpID0+IHtcbiAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgZXJyLm1lc3NhZ2UgPSBlcnIubWVzc2FnZS5yZXBsYWNlKCdsc3RhdCcsICdlbnN1cmVTeW1saW5rJylcbiAgICAgICAgcmV0dXJuIGNhbGxiYWNrKGVycilcbiAgICAgIH1cbiAgICAgIHJldHVybiBjYWxsYmFjayhudWxsLCB7XG4gICAgICAgIHRvQ3dkOiBzcmNwYXRoLFxuICAgICAgICB0b0RzdDogc3JjcGF0aFxuICAgICAgfSlcbiAgICB9KVxuICB9IGVsc2Uge1xuICAgIGNvbnN0IGRzdGRpciA9IHBhdGguZGlybmFtZShkc3RwYXRoKVxuICAgIGNvbnN0IHJlbGF0aXZlVG9Ec3QgPSBwYXRoLmpvaW4oZHN0ZGlyLCBzcmNwYXRoKVxuICAgIHJldHVybiBwYXRoRXhpc3RzKHJlbGF0aXZlVG9Ec3QsIChlcnIsIGV4aXN0cykgPT4ge1xuICAgICAgaWYgKGVycikgcmV0dXJuIGNhbGxiYWNrKGVycilcbiAgICAgIGlmIChleGlzdHMpIHtcbiAgICAgICAgcmV0dXJuIGNhbGxiYWNrKG51bGwsIHtcbiAgICAgICAgICB0b0N3ZDogcmVsYXRpdmVUb0RzdCxcbiAgICAgICAgICB0b0RzdDogc3JjcGF0aFxuICAgICAgICB9KVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIGZzLmxzdGF0KHNyY3BhdGgsIChlcnIpID0+IHtcbiAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICBlcnIubWVzc2FnZSA9IGVyci5tZXNzYWdlLnJlcGxhY2UoJ2xzdGF0JywgJ2Vuc3VyZVN5bWxpbmsnKVxuICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKGVycilcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKG51bGwsIHtcbiAgICAgICAgICAgIHRvQ3dkOiBzcmNwYXRoLFxuICAgICAgICAgICAgdG9Ec3Q6IHBhdGgucmVsYXRpdmUoZHN0ZGlyLCBzcmNwYXRoKVxuICAgICAgICAgIH0pXG4gICAgICAgIH0pXG4gICAgICB9XG4gICAgfSlcbiAgfVxufVxuXG5mdW5jdGlvbiBzeW1saW5rUGF0aHNTeW5jIChzcmNwYXRoLCBkc3RwYXRoKSB7XG4gIGxldCBleGlzdHNcbiAgaWYgKHBhdGguaXNBYnNvbHV0ZShzcmNwYXRoKSkge1xuICAgIGV4aXN0cyA9IGZzLmV4aXN0c1N5bmMoc3JjcGF0aClcbiAgICBpZiAoIWV4aXN0cykgdGhyb3cgbmV3IEVycm9yKCdhYnNvbHV0ZSBzcmNwYXRoIGRvZXMgbm90IGV4aXN0JylcbiAgICByZXR1cm4ge1xuICAgICAgdG9Dd2Q6IHNyY3BhdGgsXG4gICAgICB0b0RzdDogc3JjcGF0aFxuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBjb25zdCBkc3RkaXIgPSBwYXRoLmRpcm5hbWUoZHN0cGF0aClcbiAgICBjb25zdCByZWxhdGl2ZVRvRHN0ID0gcGF0aC5qb2luKGRzdGRpciwgc3JjcGF0aClcbiAgICBleGlzdHMgPSBmcy5leGlzdHNTeW5jKHJlbGF0aXZlVG9Ec3QpXG4gICAgaWYgKGV4aXN0cykge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgdG9Dd2Q6IHJlbGF0aXZlVG9Ec3QsXG4gICAgICAgIHRvRHN0OiBzcmNwYXRoXG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGV4aXN0cyA9IGZzLmV4aXN0c1N5bmMoc3JjcGF0aClcbiAgICAgIGlmICghZXhpc3RzKSB0aHJvdyBuZXcgRXJyb3IoJ3JlbGF0aXZlIHNyY3BhdGggZG9lcyBub3QgZXhpc3QnKVxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgdG9Dd2Q6IHNyY3BhdGgsXG4gICAgICAgIHRvRHN0OiBwYXRoLnJlbGF0aXZlKGRzdGRpciwgc3JjcGF0aClcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIHN5bWxpbmtQYXRocyxcbiAgc3ltbGlua1BhdGhzU3luY1xufVxuIiwiJ3VzZSBzdHJpY3QnXG5cbmNvbnN0IGZzID0gcmVxdWlyZSgnZ3JhY2VmdWwtZnMnKVxuXG5mdW5jdGlvbiBzeW1saW5rVHlwZSAoc3JjcGF0aCwgdHlwZSwgY2FsbGJhY2spIHtcbiAgY2FsbGJhY2sgPSAodHlwZW9mIHR5cGUgPT09ICdmdW5jdGlvbicpID8gdHlwZSA6IGNhbGxiYWNrXG4gIHR5cGUgPSAodHlwZW9mIHR5cGUgPT09ICdmdW5jdGlvbicpID8gZmFsc2UgOiB0eXBlXG4gIGlmICh0eXBlKSByZXR1cm4gY2FsbGJhY2sobnVsbCwgdHlwZSlcbiAgZnMubHN0YXQoc3JjcGF0aCwgKGVyciwgc3RhdHMpID0+IHtcbiAgICBpZiAoZXJyKSByZXR1cm4gY2FsbGJhY2sobnVsbCwgJ2ZpbGUnKVxuICAgIHR5cGUgPSAoc3RhdHMgJiYgc3RhdHMuaXNEaXJlY3RvcnkoKSkgPyAnZGlyJyA6ICdmaWxlJ1xuICAgIGNhbGxiYWNrKG51bGwsIHR5cGUpXG4gIH0pXG59XG5cbmZ1bmN0aW9uIHN5bWxpbmtUeXBlU3luYyAoc3JjcGF0aCwgdHlwZSkge1xuICBsZXQgc3RhdHNcblxuICBpZiAodHlwZSkgcmV0dXJuIHR5cGVcbiAgdHJ5IHtcbiAgICBzdGF0cyA9IGZzLmxzdGF0U3luYyhzcmNwYXRoKVxuICB9IGNhdGNoIHtcbiAgICByZXR1cm4gJ2ZpbGUnXG4gIH1cbiAgcmV0dXJuIChzdGF0cyAmJiBzdGF0cy5pc0RpcmVjdG9yeSgpKSA/ICdkaXInIDogJ2ZpbGUnXG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBzeW1saW5rVHlwZSxcbiAgc3ltbGlua1R5cGVTeW5jXG59XG4iLCIndXNlIHN0cmljdCdcblxuY29uc3QgdSA9IHJlcXVpcmUoJ3VuaXZlcnNhbGlmeScpLmZyb21DYWxsYmFja1xuY29uc3QgcGF0aCA9IHJlcXVpcmUoJ3BhdGgnKVxuY29uc3QgZnMgPSByZXF1aXJlKCcuLi9mcycpXG5jb25zdCBfbWtkaXJzID0gcmVxdWlyZSgnLi4vbWtkaXJzJylcbmNvbnN0IG1rZGlycyA9IF9ta2RpcnMubWtkaXJzXG5jb25zdCBta2RpcnNTeW5jID0gX21rZGlycy5ta2RpcnNTeW5jXG5cbmNvbnN0IF9zeW1saW5rUGF0aHMgPSByZXF1aXJlKCcuL3N5bWxpbmstcGF0aHMnKVxuY29uc3Qgc3ltbGlua1BhdGhzID0gX3N5bWxpbmtQYXRocy5zeW1saW5rUGF0aHNcbmNvbnN0IHN5bWxpbmtQYXRoc1N5bmMgPSBfc3ltbGlua1BhdGhzLnN5bWxpbmtQYXRoc1N5bmNcblxuY29uc3QgX3N5bWxpbmtUeXBlID0gcmVxdWlyZSgnLi9zeW1saW5rLXR5cGUnKVxuY29uc3Qgc3ltbGlua1R5cGUgPSBfc3ltbGlua1R5cGUuc3ltbGlua1R5cGVcbmNvbnN0IHN5bWxpbmtUeXBlU3luYyA9IF9zeW1saW5rVHlwZS5zeW1saW5rVHlwZVN5bmNcblxuY29uc3QgcGF0aEV4aXN0cyA9IHJlcXVpcmUoJy4uL3BhdGgtZXhpc3RzJykucGF0aEV4aXN0c1xuXG5jb25zdCB7IGFyZUlkZW50aWNhbCB9ID0gcmVxdWlyZSgnLi4vdXRpbC9zdGF0JylcblxuZnVuY3Rpb24gY3JlYXRlU3ltbGluayAoc3JjcGF0aCwgZHN0cGF0aCwgdHlwZSwgY2FsbGJhY2spIHtcbiAgY2FsbGJhY2sgPSAodHlwZW9mIHR5cGUgPT09ICdmdW5jdGlvbicpID8gdHlwZSA6IGNhbGxiYWNrXG4gIHR5cGUgPSAodHlwZW9mIHR5cGUgPT09ICdmdW5jdGlvbicpID8gZmFsc2UgOiB0eXBlXG5cbiAgZnMubHN0YXQoZHN0cGF0aCwgKGVyciwgc3RhdHMpID0+IHtcbiAgICBpZiAoIWVyciAmJiBzdGF0cy5pc1N5bWJvbGljTGluaygpKSB7XG4gICAgICBQcm9taXNlLmFsbChbXG4gICAgICAgIGZzLnN0YXQoc3JjcGF0aCksXG4gICAgICAgIGZzLnN0YXQoZHN0cGF0aClcbiAgICAgIF0pLnRoZW4oKFtzcmNTdGF0LCBkc3RTdGF0XSkgPT4ge1xuICAgICAgICBpZiAoYXJlSWRlbnRpY2FsKHNyY1N0YXQsIGRzdFN0YXQpKSByZXR1cm4gY2FsbGJhY2sobnVsbClcbiAgICAgICAgX2NyZWF0ZVN5bWxpbmsoc3JjcGF0aCwgZHN0cGF0aCwgdHlwZSwgY2FsbGJhY2spXG4gICAgICB9KVxuICAgIH0gZWxzZSBfY3JlYXRlU3ltbGluayhzcmNwYXRoLCBkc3RwYXRoLCB0eXBlLCBjYWxsYmFjaylcbiAgfSlcbn1cblxuZnVuY3Rpb24gX2NyZWF0ZVN5bWxpbmsgKHNyY3BhdGgsIGRzdHBhdGgsIHR5cGUsIGNhbGxiYWNrKSB7XG4gIHN5bWxpbmtQYXRocyhzcmNwYXRoLCBkc3RwYXRoLCAoZXJyLCByZWxhdGl2ZSkgPT4ge1xuICAgIGlmIChlcnIpIHJldHVybiBjYWxsYmFjayhlcnIpXG4gICAgc3JjcGF0aCA9IHJlbGF0aXZlLnRvRHN0XG4gICAgc3ltbGlua1R5cGUocmVsYXRpdmUudG9Dd2QsIHR5cGUsIChlcnIsIHR5cGUpID0+IHtcbiAgICAgIGlmIChlcnIpIHJldHVybiBjYWxsYmFjayhlcnIpXG4gICAgICBjb25zdCBkaXIgPSBwYXRoLmRpcm5hbWUoZHN0cGF0aClcbiAgICAgIHBhdGhFeGlzdHMoZGlyLCAoZXJyLCBkaXJFeGlzdHMpID0+IHtcbiAgICAgICAgaWYgKGVycikgcmV0dXJuIGNhbGxiYWNrKGVycilcbiAgICAgICAgaWYgKGRpckV4aXN0cykgcmV0dXJuIGZzLnN5bWxpbmsoc3JjcGF0aCwgZHN0cGF0aCwgdHlwZSwgY2FsbGJhY2spXG4gICAgICAgIG1rZGlycyhkaXIsIGVyciA9PiB7XG4gICAgICAgICAgaWYgKGVycikgcmV0dXJuIGNhbGxiYWNrKGVycilcbiAgICAgICAgICBmcy5zeW1saW5rKHNyY3BhdGgsIGRzdHBhdGgsIHR5cGUsIGNhbGxiYWNrKVxuICAgICAgICB9KVxuICAgICAgfSlcbiAgICB9KVxuICB9KVxufVxuXG5mdW5jdGlvbiBjcmVhdGVTeW1saW5rU3luYyAoc3JjcGF0aCwgZHN0cGF0aCwgdHlwZSkge1xuICBsZXQgc3RhdHNcbiAgdHJ5IHtcbiAgICBzdGF0cyA9IGZzLmxzdGF0U3luYyhkc3RwYXRoKVxuICB9IGNhdGNoIHt9XG4gIGlmIChzdGF0cyAmJiBzdGF0cy5pc1N5bWJvbGljTGluaygpKSB7XG4gICAgY29uc3Qgc3JjU3RhdCA9IGZzLnN0YXRTeW5jKHNyY3BhdGgpXG4gICAgY29uc3QgZHN0U3RhdCA9IGZzLnN0YXRTeW5jKGRzdHBhdGgpXG4gICAgaWYgKGFyZUlkZW50aWNhbChzcmNTdGF0LCBkc3RTdGF0KSkgcmV0dXJuXG4gIH1cblxuICBjb25zdCByZWxhdGl2ZSA9IHN5bWxpbmtQYXRoc1N5bmMoc3JjcGF0aCwgZHN0cGF0aClcbiAgc3JjcGF0aCA9IHJlbGF0aXZlLnRvRHN0XG4gIHR5cGUgPSBzeW1saW5rVHlwZVN5bmMocmVsYXRpdmUudG9Dd2QsIHR5cGUpXG4gIGNvbnN0IGRpciA9IHBhdGguZGlybmFtZShkc3RwYXRoKVxuICBjb25zdCBleGlzdHMgPSBmcy5leGlzdHNTeW5jKGRpcilcbiAgaWYgKGV4aXN0cykgcmV0dXJuIGZzLnN5bWxpbmtTeW5jKHNyY3BhdGgsIGRzdHBhdGgsIHR5cGUpXG4gIG1rZGlyc1N5bmMoZGlyKVxuICByZXR1cm4gZnMuc3ltbGlua1N5bmMoc3JjcGF0aCwgZHN0cGF0aCwgdHlwZSlcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIGNyZWF0ZVN5bWxpbms6IHUoY3JlYXRlU3ltbGluayksXG4gIGNyZWF0ZVN5bWxpbmtTeW5jXG59XG4iLCIndXNlIHN0cmljdCdcbi8vIFRoaXMgaXMgYWRhcHRlZCBmcm9tIGh0dHBzOi8vZ2l0aHViLmNvbS9ub3JtYWxpemUvbXpcbi8vIENvcHlyaWdodCAoYykgMjAxNC0yMDE2IEpvbmF0aGFuIE9uZyBtZUBqb25nbGViZXJyeS5jb20gYW5kIENvbnRyaWJ1dG9yc1xuY29uc3QgdSA9IHJlcXVpcmUoJ3VuaXZlcnNhbGlmeScpLmZyb21DYWxsYmFja1xuY29uc3QgZnMgPSByZXF1aXJlKCdncmFjZWZ1bC1mcycpXG5cbmNvbnN0IGFwaSA9IFtcbiAgJ2FjY2VzcycsXG4gICdhcHBlbmRGaWxlJyxcbiAgJ2NobW9kJyxcbiAgJ2Nob3duJyxcbiAgJ2Nsb3NlJyxcbiAgJ2NvcHlGaWxlJyxcbiAgJ2ZjaG1vZCcsXG4gICdmY2hvd24nLFxuICAnZmRhdGFzeW5jJyxcbiAgJ2ZzdGF0JyxcbiAgJ2ZzeW5jJyxcbiAgJ2Z0cnVuY2F0ZScsXG4gICdmdXRpbWVzJyxcbiAgJ2xjaG1vZCcsXG4gICdsY2hvd24nLFxuICAnbGluaycsXG4gICdsc3RhdCcsXG4gICdta2RpcicsXG4gICdta2R0ZW1wJyxcbiAgJ29wZW4nLFxuICAnb3BlbmRpcicsXG4gICdyZWFkZGlyJyxcbiAgJ3JlYWRGaWxlJyxcbiAgJ3JlYWRsaW5rJyxcbiAgJ3JlYWxwYXRoJyxcbiAgJ3JlbmFtZScsXG4gICdybScsXG4gICdybWRpcicsXG4gICdzdGF0JyxcbiAgJ3N5bWxpbmsnLFxuICAndHJ1bmNhdGUnLFxuICAndW5saW5rJyxcbiAgJ3V0aW1lcycsXG4gICd3cml0ZUZpbGUnXG5dLmZpbHRlcihrZXkgPT4ge1xuICAvLyBTb21lIGNvbW1hbmRzIGFyZSBub3QgYXZhaWxhYmxlIG9uIHNvbWUgc3lzdGVtcy4gRXg6XG4gIC8vIGZzLm9wZW5kaXIgd2FzIGFkZGVkIGluIE5vZGUuanMgdjEyLjEyLjBcbiAgLy8gZnMucm0gd2FzIGFkZGVkIGluIE5vZGUuanMgdjE0LjE0LjBcbiAgLy8gZnMubGNob3duIGlzIG5vdCBhdmFpbGFibGUgb24gYXQgbGVhc3Qgc29tZSBMaW51eFxuICByZXR1cm4gdHlwZW9mIGZzW2tleV0gPT09ICdmdW5jdGlvbidcbn0pXG5cbi8vIEV4cG9ydCBjbG9uZWQgZnM6XG5PYmplY3QuYXNzaWduKGV4cG9ydHMsIGZzKVxuXG4vLyBVbml2ZXJzYWxpZnkgYXN5bmMgbWV0aG9kczpcbmFwaS5mb3JFYWNoKG1ldGhvZCA9PiB7XG4gIGV4cG9ydHNbbWV0aG9kXSA9IHUoZnNbbWV0aG9kXSlcbn0pXG5cbi8vIFdlIGRpZmZlciBmcm9tIG16L2ZzIGluIHRoYXQgd2Ugc3RpbGwgc2hpcCB0aGUgb2xkLCBicm9rZW4sIGZzLmV4aXN0cygpXG4vLyBzaW5jZSB3ZSBhcmUgYSBkcm9wLWluIHJlcGxhY2VtZW50IGZvciB0aGUgbmF0aXZlIG1vZHVsZVxuZXhwb3J0cy5leGlzdHMgPSBmdW5jdGlvbiAoZmlsZW5hbWUsIGNhbGxiYWNrKSB7XG4gIGlmICh0eXBlb2YgY2FsbGJhY2sgPT09ICdmdW5jdGlvbicpIHtcbiAgICByZXR1cm4gZnMuZXhpc3RzKGZpbGVuYW1lLCBjYWxsYmFjaylcbiAgfVxuICByZXR1cm4gbmV3IFByb21pc2UocmVzb2x2ZSA9PiB7XG4gICAgcmV0dXJuIGZzLmV4aXN0cyhmaWxlbmFtZSwgcmVzb2x2ZSlcbiAgfSlcbn1cblxuLy8gZnMucmVhZCgpLCBmcy53cml0ZSgpLCAmIGZzLndyaXRldigpIG5lZWQgc3BlY2lhbCB0cmVhdG1lbnQgZHVlIHRvIG11bHRpcGxlIGNhbGxiYWNrIGFyZ3NcblxuZXhwb3J0cy5yZWFkID0gZnVuY3Rpb24gKGZkLCBidWZmZXIsIG9mZnNldCwgbGVuZ3RoLCBwb3NpdGlvbiwgY2FsbGJhY2spIHtcbiAgaWYgKHR5cGVvZiBjYWxsYmFjayA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIHJldHVybiBmcy5yZWFkKGZkLCBidWZmZXIsIG9mZnNldCwgbGVuZ3RoLCBwb3NpdGlvbiwgY2FsbGJhY2spXG4gIH1cbiAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICBmcy5yZWFkKGZkLCBidWZmZXIsIG9mZnNldCwgbGVuZ3RoLCBwb3NpdGlvbiwgKGVyciwgYnl0ZXNSZWFkLCBidWZmZXIpID0+IHtcbiAgICAgIGlmIChlcnIpIHJldHVybiByZWplY3QoZXJyKVxuICAgICAgcmVzb2x2ZSh7IGJ5dGVzUmVhZCwgYnVmZmVyIH0pXG4gICAgfSlcbiAgfSlcbn1cblxuLy8gRnVuY3Rpb24gc2lnbmF0dXJlIGNhbiBiZVxuLy8gZnMud3JpdGUoZmQsIGJ1ZmZlclssIG9mZnNldFssIGxlbmd0aFssIHBvc2l0aW9uXV1dLCBjYWxsYmFjaylcbi8vIE9SXG4vLyBmcy53cml0ZShmZCwgc3RyaW5nWywgcG9zaXRpb25bLCBlbmNvZGluZ11dLCBjYWxsYmFjaylcbi8vIFdlIG5lZWQgdG8gaGFuZGxlIGJvdGggY2FzZXMsIHNvIHdlIHVzZSAuLi5hcmdzXG5leHBvcnRzLndyaXRlID0gZnVuY3Rpb24gKGZkLCBidWZmZXIsIC4uLmFyZ3MpIHtcbiAgaWYgKHR5cGVvZiBhcmdzW2FyZ3MubGVuZ3RoIC0gMV0gPT09ICdmdW5jdGlvbicpIHtcbiAgICByZXR1cm4gZnMud3JpdGUoZmQsIGJ1ZmZlciwgLi4uYXJncylcbiAgfVxuXG4gIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgZnMud3JpdGUoZmQsIGJ1ZmZlciwgLi4uYXJncywgKGVyciwgYnl0ZXNXcml0dGVuLCBidWZmZXIpID0+IHtcbiAgICAgIGlmIChlcnIpIHJldHVybiByZWplY3QoZXJyKVxuICAgICAgcmVzb2x2ZSh7IGJ5dGVzV3JpdHRlbiwgYnVmZmVyIH0pXG4gICAgfSlcbiAgfSlcbn1cblxuLy8gZnMud3JpdGV2IG9ubHkgYXZhaWxhYmxlIGluIE5vZGUgdjEyLjkuMCtcbmlmICh0eXBlb2YgZnMud3JpdGV2ID09PSAnZnVuY3Rpb24nKSB7XG4gIC8vIEZ1bmN0aW9uIHNpZ25hdHVyZSBpc1xuICAvLyBzLndyaXRldihmZCwgYnVmZmVyc1ssIHBvc2l0aW9uXSwgY2FsbGJhY2spXG4gIC8vIFdlIG5lZWQgdG8gaGFuZGxlIHRoZSBvcHRpb25hbCBhcmcsIHNvIHdlIHVzZSAuLi5hcmdzXG4gIGV4cG9ydHMud3JpdGV2ID0gZnVuY3Rpb24gKGZkLCBidWZmZXJzLCAuLi5hcmdzKSB7XG4gICAgaWYgKHR5cGVvZiBhcmdzW2FyZ3MubGVuZ3RoIC0gMV0gPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIHJldHVybiBmcy53cml0ZXYoZmQsIGJ1ZmZlcnMsIC4uLmFyZ3MpXG4gICAgfVxuXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgIGZzLndyaXRldihmZCwgYnVmZmVycywgLi4uYXJncywgKGVyciwgYnl0ZXNXcml0dGVuLCBidWZmZXJzKSA9PiB7XG4gICAgICAgIGlmIChlcnIpIHJldHVybiByZWplY3QoZXJyKVxuICAgICAgICByZXNvbHZlKHsgYnl0ZXNXcml0dGVuLCBidWZmZXJzIH0pXG4gICAgICB9KVxuICAgIH0pXG4gIH1cbn1cblxuLy8gZnMucmVhbHBhdGgubmF0aXZlIHNvbWV0aW1lcyBub3QgYXZhaWxhYmxlIGlmIGZzIGlzIG1vbmtleS1wYXRjaGVkXG5pZiAodHlwZW9mIGZzLnJlYWxwYXRoLm5hdGl2ZSA9PT0gJ2Z1bmN0aW9uJykge1xuICBleHBvcnRzLnJlYWxwYXRoLm5hdGl2ZSA9IHUoZnMucmVhbHBhdGgubmF0aXZlKVxufSBlbHNlIHtcbiAgcHJvY2Vzcy5lbWl0V2FybmluZyhcbiAgICAnZnMucmVhbHBhdGgubmF0aXZlIGlzIG5vdCBhIGZ1bmN0aW9uLiBJcyBmcyBiZWluZyBtb25rZXktcGF0Y2hlZD8nLFxuICAgICdXYXJuaW5nJywgJ2ZzLWV4dHJhLVdBUk4wMDAzJ1xuICApXG59XG4iLCIndXNlIHN0cmljdCdcblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIC8vIEV4cG9ydCBwcm9taXNlaWZpZWQgZ3JhY2VmdWwtZnM6XG4gIC4uLnJlcXVpcmUoJy4vZnMnKSxcbiAgLy8gRXhwb3J0IGV4dHJhIG1ldGhvZHM6XG4gIC4uLnJlcXVpcmUoJy4vY29weScpLFxuICAuLi5yZXF1aXJlKCcuL2VtcHR5JyksXG4gIC4uLnJlcXVpcmUoJy4vZW5zdXJlJyksXG4gIC4uLnJlcXVpcmUoJy4vanNvbicpLFxuICAuLi5yZXF1aXJlKCcuL21rZGlycycpLFxuICAuLi5yZXF1aXJlKCcuL21vdmUnKSxcbiAgLi4ucmVxdWlyZSgnLi9vdXRwdXQtZmlsZScpLFxuICAuLi5yZXF1aXJlKCcuL3BhdGgtZXhpc3RzJyksXG4gIC4uLnJlcXVpcmUoJy4vcmVtb3ZlJylcbn1cbiIsIid1c2Ugc3RyaWN0J1xuXG5jb25zdCB1ID0gcmVxdWlyZSgndW5pdmVyc2FsaWZ5JykuZnJvbVByb21pc2VcbmNvbnN0IGpzb25GaWxlID0gcmVxdWlyZSgnLi9qc29uZmlsZScpXG5cbmpzb25GaWxlLm91dHB1dEpzb24gPSB1KHJlcXVpcmUoJy4vb3V0cHV0LWpzb24nKSlcbmpzb25GaWxlLm91dHB1dEpzb25TeW5jID0gcmVxdWlyZSgnLi9vdXRwdXQtanNvbi1zeW5jJylcbi8vIGFsaWFzZXNcbmpzb25GaWxlLm91dHB1dEpTT04gPSBqc29uRmlsZS5vdXRwdXRKc29uXG5qc29uRmlsZS5vdXRwdXRKU09OU3luYyA9IGpzb25GaWxlLm91dHB1dEpzb25TeW5jXG5qc29uRmlsZS53cml0ZUpTT04gPSBqc29uRmlsZS53cml0ZUpzb25cbmpzb25GaWxlLndyaXRlSlNPTlN5bmMgPSBqc29uRmlsZS53cml0ZUpzb25TeW5jXG5qc29uRmlsZS5yZWFkSlNPTiA9IGpzb25GaWxlLnJlYWRKc29uXG5qc29uRmlsZS5yZWFkSlNPTlN5bmMgPSBqc29uRmlsZS5yZWFkSnNvblN5bmNcblxubW9kdWxlLmV4cG9ydHMgPSBqc29uRmlsZVxuIiwiJ3VzZSBzdHJpY3QnXG5cbmNvbnN0IGpzb25GaWxlID0gcmVxdWlyZSgnanNvbmZpbGUnKVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgLy8ganNvbmZpbGUgZXhwb3J0c1xuICByZWFkSnNvbjoganNvbkZpbGUucmVhZEZpbGUsXG4gIHJlYWRKc29uU3luYzoganNvbkZpbGUucmVhZEZpbGVTeW5jLFxuICB3cml0ZUpzb246IGpzb25GaWxlLndyaXRlRmlsZSxcbiAgd3JpdGVKc29uU3luYzoganNvbkZpbGUud3JpdGVGaWxlU3luY1xufVxuIiwiJ3VzZSBzdHJpY3QnXG5cbmNvbnN0IHsgc3RyaW5naWZ5IH0gPSByZXF1aXJlKCdqc29uZmlsZS91dGlscycpXG5jb25zdCB7IG91dHB1dEZpbGVTeW5jIH0gPSByZXF1aXJlKCcuLi9vdXRwdXQtZmlsZScpXG5cbmZ1bmN0aW9uIG91dHB1dEpzb25TeW5jIChmaWxlLCBkYXRhLCBvcHRpb25zKSB7XG4gIGNvbnN0IHN0ciA9IHN0cmluZ2lmeShkYXRhLCBvcHRpb25zKVxuXG4gIG91dHB1dEZpbGVTeW5jKGZpbGUsIHN0ciwgb3B0aW9ucylcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBvdXRwdXRKc29uU3luY1xuIiwiJ3VzZSBzdHJpY3QnXG5cbmNvbnN0IHsgc3RyaW5naWZ5IH0gPSByZXF1aXJlKCdqc29uZmlsZS91dGlscycpXG5jb25zdCB7IG91dHB1dEZpbGUgfSA9IHJlcXVpcmUoJy4uL291dHB1dC1maWxlJylcblxuYXN5bmMgZnVuY3Rpb24gb3V0cHV0SnNvbiAoZmlsZSwgZGF0YSwgb3B0aW9ucyA9IHt9KSB7XG4gIGNvbnN0IHN0ciA9IHN0cmluZ2lmeShkYXRhLCBvcHRpb25zKVxuXG4gIGF3YWl0IG91dHB1dEZpbGUoZmlsZSwgc3RyLCBvcHRpb25zKVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IG91dHB1dEpzb25cbiIsIid1c2Ugc3RyaWN0J1xuY29uc3QgdSA9IHJlcXVpcmUoJ3VuaXZlcnNhbGlmeScpLmZyb21Qcm9taXNlXG5jb25zdCB7IG1ha2VEaXI6IF9tYWtlRGlyLCBtYWtlRGlyU3luYyB9ID0gcmVxdWlyZSgnLi9tYWtlLWRpcicpXG5jb25zdCBtYWtlRGlyID0gdShfbWFrZURpcilcblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIG1rZGlyczogbWFrZURpcixcbiAgbWtkaXJzU3luYzogbWFrZURpclN5bmMsXG4gIC8vIGFsaWFzXG4gIG1rZGlycDogbWFrZURpcixcbiAgbWtkaXJwU3luYzogbWFrZURpclN5bmMsXG4gIGVuc3VyZURpcjogbWFrZURpcixcbiAgZW5zdXJlRGlyU3luYzogbWFrZURpclN5bmNcbn1cbiIsIid1c2Ugc3RyaWN0J1xuY29uc3QgZnMgPSByZXF1aXJlKCcuLi9mcycpXG5jb25zdCB7IGNoZWNrUGF0aCB9ID0gcmVxdWlyZSgnLi91dGlscycpXG5cbmNvbnN0IGdldE1vZGUgPSBvcHRpb25zID0+IHtcbiAgY29uc3QgZGVmYXVsdHMgPSB7IG1vZGU6IDBvNzc3IH1cbiAgaWYgKHR5cGVvZiBvcHRpb25zID09PSAnbnVtYmVyJykgcmV0dXJuIG9wdGlvbnNcbiAgcmV0dXJuICh7IC4uLmRlZmF1bHRzLCAuLi5vcHRpb25zIH0pLm1vZGVcbn1cblxubW9kdWxlLmV4cG9ydHMubWFrZURpciA9IGFzeW5jIChkaXIsIG9wdGlvbnMpID0+IHtcbiAgY2hlY2tQYXRoKGRpcilcblxuICByZXR1cm4gZnMubWtkaXIoZGlyLCB7XG4gICAgbW9kZTogZ2V0TW9kZShvcHRpb25zKSxcbiAgICByZWN1cnNpdmU6IHRydWVcbiAgfSlcbn1cblxubW9kdWxlLmV4cG9ydHMubWFrZURpclN5bmMgPSAoZGlyLCBvcHRpb25zKSA9PiB7XG4gIGNoZWNrUGF0aChkaXIpXG5cbiAgcmV0dXJuIGZzLm1rZGlyU3luYyhkaXIsIHtcbiAgICBtb2RlOiBnZXRNb2RlKG9wdGlvbnMpLFxuICAgIHJlY3Vyc2l2ZTogdHJ1ZVxuICB9KVxufVxuIiwiLy8gQWRhcHRlZCBmcm9tIGh0dHBzOi8vZ2l0aHViLmNvbS9zaW5kcmVzb3JodXMvbWFrZS1kaXJcbi8vIENvcHlyaWdodCAoYykgU2luZHJlIFNvcmh1cyA8c2luZHJlc29yaHVzQGdtYWlsLmNvbT4gKHNpbmRyZXNvcmh1cy5jb20pXG4vLyBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYSBjb3B5IG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlIFwiU29mdHdhcmVcIiksIHRvIGRlYWwgaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0cyB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXQgcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpcyBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlIGZvbGxvd2luZyBjb25kaXRpb25zOlxuLy8gVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWQgaW4gYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4vLyBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTIE9SIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLCBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEUgQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSwgREFNQUdFUyBPUiBPVEhFUiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLCBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRSBTT0ZUV0FSRS5cbid1c2Ugc3RyaWN0J1xuY29uc3QgcGF0aCA9IHJlcXVpcmUoJ3BhdGgnKVxuXG4vLyBodHRwczovL2dpdGh1Yi5jb20vbm9kZWpzL25vZGUvaXNzdWVzLzg5ODdcbi8vIGh0dHBzOi8vZ2l0aHViLmNvbS9saWJ1di9saWJ1di9wdWxsLzEwODhcbm1vZHVsZS5leHBvcnRzLmNoZWNrUGF0aCA9IGZ1bmN0aW9uIGNoZWNrUGF0aCAocHRoKSB7XG4gIGlmIChwcm9jZXNzLnBsYXRmb3JtID09PSAnd2luMzInKSB7XG4gICAgY29uc3QgcGF0aEhhc0ludmFsaWRXaW5DaGFyYWN0ZXJzID0gL1s8PjpcInw/Kl0vLnRlc3QocHRoLnJlcGxhY2UocGF0aC5wYXJzZShwdGgpLnJvb3QsICcnKSlcblxuICAgIGlmIChwYXRoSGFzSW52YWxpZFdpbkNoYXJhY3RlcnMpIHtcbiAgICAgIGNvbnN0IGVycm9yID0gbmV3IEVycm9yKGBQYXRoIGNvbnRhaW5zIGludmFsaWQgY2hhcmFjdGVyczogJHtwdGh9YClcbiAgICAgIGVycm9yLmNvZGUgPSAnRUlOVkFMJ1xuICAgICAgdGhyb3cgZXJyb3JcbiAgICB9XG4gIH1cbn1cbiIsIid1c2Ugc3RyaWN0J1xuXG5jb25zdCB1ID0gcmVxdWlyZSgndW5pdmVyc2FsaWZ5JykuZnJvbUNhbGxiYWNrXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgbW92ZTogdShyZXF1aXJlKCcuL21vdmUnKSksXG4gIG1vdmVTeW5jOiByZXF1aXJlKCcuL21vdmUtc3luYycpXG59XG4iLCIndXNlIHN0cmljdCdcblxuY29uc3QgZnMgPSByZXF1aXJlKCdncmFjZWZ1bC1mcycpXG5jb25zdCBwYXRoID0gcmVxdWlyZSgncGF0aCcpXG5jb25zdCBjb3B5U3luYyA9IHJlcXVpcmUoJy4uL2NvcHknKS5jb3B5U3luY1xuY29uc3QgcmVtb3ZlU3luYyA9IHJlcXVpcmUoJy4uL3JlbW92ZScpLnJlbW92ZVN5bmNcbmNvbnN0IG1rZGlycFN5bmMgPSByZXF1aXJlKCcuLi9ta2RpcnMnKS5ta2RpcnBTeW5jXG5jb25zdCBzdGF0ID0gcmVxdWlyZSgnLi4vdXRpbC9zdGF0JylcblxuZnVuY3Rpb24gbW92ZVN5bmMgKHNyYywgZGVzdCwgb3B0cykge1xuICBvcHRzID0gb3B0cyB8fCB7fVxuICBjb25zdCBvdmVyd3JpdGUgPSBvcHRzLm92ZXJ3cml0ZSB8fCBvcHRzLmNsb2JiZXIgfHwgZmFsc2VcblxuICBjb25zdCB7IHNyY1N0YXQsIGlzQ2hhbmdpbmdDYXNlID0gZmFsc2UgfSA9IHN0YXQuY2hlY2tQYXRoc1N5bmMoc3JjLCBkZXN0LCAnbW92ZScsIG9wdHMpXG4gIHN0YXQuY2hlY2tQYXJlbnRQYXRoc1N5bmMoc3JjLCBzcmNTdGF0LCBkZXN0LCAnbW92ZScpXG4gIGlmICghaXNQYXJlbnRSb290KGRlc3QpKSBta2RpcnBTeW5jKHBhdGguZGlybmFtZShkZXN0KSlcbiAgcmV0dXJuIGRvUmVuYW1lKHNyYywgZGVzdCwgb3ZlcndyaXRlLCBpc0NoYW5naW5nQ2FzZSlcbn1cblxuZnVuY3Rpb24gaXNQYXJlbnRSb290IChkZXN0KSB7XG4gIGNvbnN0IHBhcmVudCA9IHBhdGguZGlybmFtZShkZXN0KVxuICBjb25zdCBwYXJzZWRQYXRoID0gcGF0aC5wYXJzZShwYXJlbnQpXG4gIHJldHVybiBwYXJzZWRQYXRoLnJvb3QgPT09IHBhcmVudFxufVxuXG5mdW5jdGlvbiBkb1JlbmFtZSAoc3JjLCBkZXN0LCBvdmVyd3JpdGUsIGlzQ2hhbmdpbmdDYXNlKSB7XG4gIGlmIChpc0NoYW5naW5nQ2FzZSkgcmV0dXJuIHJlbmFtZShzcmMsIGRlc3QsIG92ZXJ3cml0ZSlcbiAgaWYgKG92ZXJ3cml0ZSkge1xuICAgIHJlbW92ZVN5bmMoZGVzdClcbiAgICByZXR1cm4gcmVuYW1lKHNyYywgZGVzdCwgb3ZlcndyaXRlKVxuICB9XG4gIGlmIChmcy5leGlzdHNTeW5jKGRlc3QpKSB0aHJvdyBuZXcgRXJyb3IoJ2Rlc3QgYWxyZWFkeSBleGlzdHMuJylcbiAgcmV0dXJuIHJlbmFtZShzcmMsIGRlc3QsIG92ZXJ3cml0ZSlcbn1cblxuZnVuY3Rpb24gcmVuYW1lIChzcmMsIGRlc3QsIG92ZXJ3cml0ZSkge1xuICB0cnkge1xuICAgIGZzLnJlbmFtZVN5bmMoc3JjLCBkZXN0KVxuICB9IGNhdGNoIChlcnIpIHtcbiAgICBpZiAoZXJyLmNvZGUgIT09ICdFWERFVicpIHRocm93IGVyclxuICAgIHJldHVybiBtb3ZlQWNyb3NzRGV2aWNlKHNyYywgZGVzdCwgb3ZlcndyaXRlKVxuICB9XG59XG5cbmZ1bmN0aW9uIG1vdmVBY3Jvc3NEZXZpY2UgKHNyYywgZGVzdCwgb3ZlcndyaXRlKSB7XG4gIGNvbnN0IG9wdHMgPSB7XG4gICAgb3ZlcndyaXRlLFxuICAgIGVycm9yT25FeGlzdDogdHJ1ZVxuICB9XG4gIGNvcHlTeW5jKHNyYywgZGVzdCwgb3B0cylcbiAgcmV0dXJuIHJlbW92ZVN5bmMoc3JjKVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IG1vdmVTeW5jXG4iLCIndXNlIHN0cmljdCdcblxuY29uc3QgZnMgPSByZXF1aXJlKCdncmFjZWZ1bC1mcycpXG5jb25zdCBwYXRoID0gcmVxdWlyZSgncGF0aCcpXG5jb25zdCBjb3B5ID0gcmVxdWlyZSgnLi4vY29weScpLmNvcHlcbmNvbnN0IHJlbW92ZSA9IHJlcXVpcmUoJy4uL3JlbW92ZScpLnJlbW92ZVxuY29uc3QgbWtkaXJwID0gcmVxdWlyZSgnLi4vbWtkaXJzJykubWtkaXJwXG5jb25zdCBwYXRoRXhpc3RzID0gcmVxdWlyZSgnLi4vcGF0aC1leGlzdHMnKS5wYXRoRXhpc3RzXG5jb25zdCBzdGF0ID0gcmVxdWlyZSgnLi4vdXRpbC9zdGF0JylcblxuZnVuY3Rpb24gbW92ZSAoc3JjLCBkZXN0LCBvcHRzLCBjYikge1xuICBpZiAodHlwZW9mIG9wdHMgPT09ICdmdW5jdGlvbicpIHtcbiAgICBjYiA9IG9wdHNcbiAgICBvcHRzID0ge31cbiAgfVxuXG4gIG9wdHMgPSBvcHRzIHx8IHt9XG5cbiAgY29uc3Qgb3ZlcndyaXRlID0gb3B0cy5vdmVyd3JpdGUgfHwgb3B0cy5jbG9iYmVyIHx8IGZhbHNlXG5cbiAgc3RhdC5jaGVja1BhdGhzKHNyYywgZGVzdCwgJ21vdmUnLCBvcHRzLCAoZXJyLCBzdGF0cykgPT4ge1xuICAgIGlmIChlcnIpIHJldHVybiBjYihlcnIpXG4gICAgY29uc3QgeyBzcmNTdGF0LCBpc0NoYW5naW5nQ2FzZSA9IGZhbHNlIH0gPSBzdGF0c1xuICAgIHN0YXQuY2hlY2tQYXJlbnRQYXRocyhzcmMsIHNyY1N0YXQsIGRlc3QsICdtb3ZlJywgZXJyID0+IHtcbiAgICAgIGlmIChlcnIpIHJldHVybiBjYihlcnIpXG4gICAgICBpZiAoaXNQYXJlbnRSb290KGRlc3QpKSByZXR1cm4gZG9SZW5hbWUoc3JjLCBkZXN0LCBvdmVyd3JpdGUsIGlzQ2hhbmdpbmdDYXNlLCBjYilcbiAgICAgIG1rZGlycChwYXRoLmRpcm5hbWUoZGVzdCksIGVyciA9PiB7XG4gICAgICAgIGlmIChlcnIpIHJldHVybiBjYihlcnIpXG4gICAgICAgIHJldHVybiBkb1JlbmFtZShzcmMsIGRlc3QsIG92ZXJ3cml0ZSwgaXNDaGFuZ2luZ0Nhc2UsIGNiKVxuICAgICAgfSlcbiAgICB9KVxuICB9KVxufVxuXG5mdW5jdGlvbiBpc1BhcmVudFJvb3QgKGRlc3QpIHtcbiAgY29uc3QgcGFyZW50ID0gcGF0aC5kaXJuYW1lKGRlc3QpXG4gIGNvbnN0IHBhcnNlZFBhdGggPSBwYXRoLnBhcnNlKHBhcmVudClcbiAgcmV0dXJuIHBhcnNlZFBhdGgucm9vdCA9PT0gcGFyZW50XG59XG5cbmZ1bmN0aW9uIGRvUmVuYW1lIChzcmMsIGRlc3QsIG92ZXJ3cml0ZSwgaXNDaGFuZ2luZ0Nhc2UsIGNiKSB7XG4gIGlmIChpc0NoYW5naW5nQ2FzZSkgcmV0dXJuIHJlbmFtZShzcmMsIGRlc3QsIG92ZXJ3cml0ZSwgY2IpXG4gIGlmIChvdmVyd3JpdGUpIHtcbiAgICByZXR1cm4gcmVtb3ZlKGRlc3QsIGVyciA9PiB7XG4gICAgICBpZiAoZXJyKSByZXR1cm4gY2IoZXJyKVxuICAgICAgcmV0dXJuIHJlbmFtZShzcmMsIGRlc3QsIG92ZXJ3cml0ZSwgY2IpXG4gICAgfSlcbiAgfVxuICBwYXRoRXhpc3RzKGRlc3QsIChlcnIsIGRlc3RFeGlzdHMpID0+IHtcbiAgICBpZiAoZXJyKSByZXR1cm4gY2IoZXJyKVxuICAgIGlmIChkZXN0RXhpc3RzKSByZXR1cm4gY2IobmV3IEVycm9yKCdkZXN0IGFscmVhZHkgZXhpc3RzLicpKVxuICAgIHJldHVybiByZW5hbWUoc3JjLCBkZXN0LCBvdmVyd3JpdGUsIGNiKVxuICB9KVxufVxuXG5mdW5jdGlvbiByZW5hbWUgKHNyYywgZGVzdCwgb3ZlcndyaXRlLCBjYikge1xuICBmcy5yZW5hbWUoc3JjLCBkZXN0LCBlcnIgPT4ge1xuICAgIGlmICghZXJyKSByZXR1cm4gY2IoKVxuICAgIGlmIChlcnIuY29kZSAhPT0gJ0VYREVWJykgcmV0dXJuIGNiKGVycilcbiAgICByZXR1cm4gbW92ZUFjcm9zc0RldmljZShzcmMsIGRlc3QsIG92ZXJ3cml0ZSwgY2IpXG4gIH0pXG59XG5cbmZ1bmN0aW9uIG1vdmVBY3Jvc3NEZXZpY2UgKHNyYywgZGVzdCwgb3ZlcndyaXRlLCBjYikge1xuICBjb25zdCBvcHRzID0ge1xuICAgIG92ZXJ3cml0ZSxcbiAgICBlcnJvck9uRXhpc3Q6IHRydWVcbiAgfVxuICBjb3B5KHNyYywgZGVzdCwgb3B0cywgZXJyID0+IHtcbiAgICBpZiAoZXJyKSByZXR1cm4gY2IoZXJyKVxuICAgIHJldHVybiByZW1vdmUoc3JjLCBjYilcbiAgfSlcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBtb3ZlXG4iLCIndXNlIHN0cmljdCdcblxuY29uc3QgdSA9IHJlcXVpcmUoJ3VuaXZlcnNhbGlmeScpLmZyb21DYWxsYmFja1xuY29uc3QgZnMgPSByZXF1aXJlKCdncmFjZWZ1bC1mcycpXG5jb25zdCBwYXRoID0gcmVxdWlyZSgncGF0aCcpXG5jb25zdCBta2RpciA9IHJlcXVpcmUoJy4uL21rZGlycycpXG5jb25zdCBwYXRoRXhpc3RzID0gcmVxdWlyZSgnLi4vcGF0aC1leGlzdHMnKS5wYXRoRXhpc3RzXG5cbmZ1bmN0aW9uIG91dHB1dEZpbGUgKGZpbGUsIGRhdGEsIGVuY29kaW5nLCBjYWxsYmFjaykge1xuICBpZiAodHlwZW9mIGVuY29kaW5nID09PSAnZnVuY3Rpb24nKSB7XG4gICAgY2FsbGJhY2sgPSBlbmNvZGluZ1xuICAgIGVuY29kaW5nID0gJ3V0ZjgnXG4gIH1cblxuICBjb25zdCBkaXIgPSBwYXRoLmRpcm5hbWUoZmlsZSlcbiAgcGF0aEV4aXN0cyhkaXIsIChlcnIsIGl0RG9lcykgPT4ge1xuICAgIGlmIChlcnIpIHJldHVybiBjYWxsYmFjayhlcnIpXG4gICAgaWYgKGl0RG9lcykgcmV0dXJuIGZzLndyaXRlRmlsZShmaWxlLCBkYXRhLCBlbmNvZGluZywgY2FsbGJhY2spXG5cbiAgICBta2Rpci5ta2RpcnMoZGlyLCBlcnIgPT4ge1xuICAgICAgaWYgKGVycikgcmV0dXJuIGNhbGxiYWNrKGVycilcblxuICAgICAgZnMud3JpdGVGaWxlKGZpbGUsIGRhdGEsIGVuY29kaW5nLCBjYWxsYmFjaylcbiAgICB9KVxuICB9KVxufVxuXG5mdW5jdGlvbiBvdXRwdXRGaWxlU3luYyAoZmlsZSwgLi4uYXJncykge1xuICBjb25zdCBkaXIgPSBwYXRoLmRpcm5hbWUoZmlsZSlcbiAgaWYgKGZzLmV4aXN0c1N5bmMoZGlyKSkge1xuICAgIHJldHVybiBmcy53cml0ZUZpbGVTeW5jKGZpbGUsIC4uLmFyZ3MpXG4gIH1cbiAgbWtkaXIubWtkaXJzU3luYyhkaXIpXG4gIGZzLndyaXRlRmlsZVN5bmMoZmlsZSwgLi4uYXJncylcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIG91dHB1dEZpbGU6IHUob3V0cHV0RmlsZSksXG4gIG91dHB1dEZpbGVTeW5jXG59XG4iLCIndXNlIHN0cmljdCdcbmNvbnN0IHUgPSByZXF1aXJlKCd1bml2ZXJzYWxpZnknKS5mcm9tUHJvbWlzZVxuY29uc3QgZnMgPSByZXF1aXJlKCcuLi9mcycpXG5cbmZ1bmN0aW9uIHBhdGhFeGlzdHMgKHBhdGgpIHtcbiAgcmV0dXJuIGZzLmFjY2VzcyhwYXRoKS50aGVuKCgpID0+IHRydWUpLmNhdGNoKCgpID0+IGZhbHNlKVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgcGF0aEV4aXN0czogdShwYXRoRXhpc3RzKSxcbiAgcGF0aEV4aXN0c1N5bmM6IGZzLmV4aXN0c1N5bmNcbn1cbiIsIid1c2Ugc3RyaWN0J1xuXG5jb25zdCBmcyA9IHJlcXVpcmUoJ2dyYWNlZnVsLWZzJylcbmNvbnN0IHUgPSByZXF1aXJlKCd1bml2ZXJzYWxpZnknKS5mcm9tQ2FsbGJhY2tcbmNvbnN0IHJpbXJhZiA9IHJlcXVpcmUoJy4vcmltcmFmJylcblxuZnVuY3Rpb24gcmVtb3ZlIChwYXRoLCBjYWxsYmFjaykge1xuICAvLyBOb2RlIDE0LjE0LjArXG4gIGlmIChmcy5ybSkgcmV0dXJuIGZzLnJtKHBhdGgsIHsgcmVjdXJzaXZlOiB0cnVlLCBmb3JjZTogdHJ1ZSB9LCBjYWxsYmFjaylcbiAgcmltcmFmKHBhdGgsIGNhbGxiYWNrKVxufVxuXG5mdW5jdGlvbiByZW1vdmVTeW5jIChwYXRoKSB7XG4gIC8vIE5vZGUgMTQuMTQuMCtcbiAgaWYgKGZzLnJtU3luYykgcmV0dXJuIGZzLnJtU3luYyhwYXRoLCB7IHJlY3Vyc2l2ZTogdHJ1ZSwgZm9yY2U6IHRydWUgfSlcbiAgcmltcmFmLnN5bmMocGF0aClcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIHJlbW92ZTogdShyZW1vdmUpLFxuICByZW1vdmVTeW5jXG59XG4iLCIndXNlIHN0cmljdCdcblxuY29uc3QgZnMgPSByZXF1aXJlKCdncmFjZWZ1bC1mcycpXG5jb25zdCBwYXRoID0gcmVxdWlyZSgncGF0aCcpXG5jb25zdCBhc3NlcnQgPSByZXF1aXJlKCdhc3NlcnQnKVxuXG5jb25zdCBpc1dpbmRvd3MgPSAocHJvY2Vzcy5wbGF0Zm9ybSA9PT0gJ3dpbjMyJylcblxuZnVuY3Rpb24gZGVmYXVsdHMgKG9wdGlvbnMpIHtcbiAgY29uc3QgbWV0aG9kcyA9IFtcbiAgICAndW5saW5rJyxcbiAgICAnY2htb2QnLFxuICAgICdzdGF0JyxcbiAgICAnbHN0YXQnLFxuICAgICdybWRpcicsXG4gICAgJ3JlYWRkaXInXG4gIF1cbiAgbWV0aG9kcy5mb3JFYWNoKG0gPT4ge1xuICAgIG9wdGlvbnNbbV0gPSBvcHRpb25zW21dIHx8IGZzW21dXG4gICAgbSA9IG0gKyAnU3luYydcbiAgICBvcHRpb25zW21dID0gb3B0aW9uc1ttXSB8fCBmc1ttXVxuICB9KVxuXG4gIG9wdGlvbnMubWF4QnVzeVRyaWVzID0gb3B0aW9ucy5tYXhCdXN5VHJpZXMgfHwgM1xufVxuXG5mdW5jdGlvbiByaW1yYWYgKHAsIG9wdGlvbnMsIGNiKSB7XG4gIGxldCBidXN5VHJpZXMgPSAwXG5cbiAgaWYgKHR5cGVvZiBvcHRpb25zID09PSAnZnVuY3Rpb24nKSB7XG4gICAgY2IgPSBvcHRpb25zXG4gICAgb3B0aW9ucyA9IHt9XG4gIH1cblxuICBhc3NlcnQocCwgJ3JpbXJhZjogbWlzc2luZyBwYXRoJylcbiAgYXNzZXJ0LnN0cmljdEVxdWFsKHR5cGVvZiBwLCAnc3RyaW5nJywgJ3JpbXJhZjogcGF0aCBzaG91bGQgYmUgYSBzdHJpbmcnKVxuICBhc3NlcnQuc3RyaWN0RXF1YWwodHlwZW9mIGNiLCAnZnVuY3Rpb24nLCAncmltcmFmOiBjYWxsYmFjayBmdW5jdGlvbiByZXF1aXJlZCcpXG4gIGFzc2VydChvcHRpb25zLCAncmltcmFmOiBpbnZhbGlkIG9wdGlvbnMgYXJndW1lbnQgcHJvdmlkZWQnKVxuICBhc3NlcnQuc3RyaWN0RXF1YWwodHlwZW9mIG9wdGlvbnMsICdvYmplY3QnLCAncmltcmFmOiBvcHRpb25zIHNob3VsZCBiZSBvYmplY3QnKVxuXG4gIGRlZmF1bHRzKG9wdGlvbnMpXG5cbiAgcmltcmFmXyhwLCBvcHRpb25zLCBmdW5jdGlvbiBDQiAoZXIpIHtcbiAgICBpZiAoZXIpIHtcbiAgICAgIGlmICgoZXIuY29kZSA9PT0gJ0VCVVNZJyB8fCBlci5jb2RlID09PSAnRU5PVEVNUFRZJyB8fCBlci5jb2RlID09PSAnRVBFUk0nKSAmJlxuICAgICAgICAgIGJ1c3lUcmllcyA8IG9wdGlvbnMubWF4QnVzeVRyaWVzKSB7XG4gICAgICAgIGJ1c3lUcmllcysrXG4gICAgICAgIGNvbnN0IHRpbWUgPSBidXN5VHJpZXMgKiAxMDBcbiAgICAgICAgLy8gdHJ5IGFnYWluLCB3aXRoIHRoZSBzYW1lIGV4YWN0IGNhbGxiYWNrIGFzIHRoaXMgb25lLlxuICAgICAgICByZXR1cm4gc2V0VGltZW91dCgoKSA9PiByaW1yYWZfKHAsIG9wdGlvbnMsIENCKSwgdGltZSlcbiAgICAgIH1cblxuICAgICAgLy8gYWxyZWFkeSBnb25lXG4gICAgICBpZiAoZXIuY29kZSA9PT0gJ0VOT0VOVCcpIGVyID0gbnVsbFxuICAgIH1cblxuICAgIGNiKGVyKVxuICB9KVxufVxuXG4vLyBUd28gcG9zc2libGUgc3RyYXRlZ2llcy5cbi8vIDEuIEFzc3VtZSBpdCdzIGEgZmlsZS4gIHVubGluayBpdCwgdGhlbiBkbyB0aGUgZGlyIHN0dWZmIG9uIEVQRVJNIG9yIEVJU0RJUlxuLy8gMi4gQXNzdW1lIGl0J3MgYSBkaXJlY3RvcnkuICByZWFkZGlyLCB0aGVuIGRvIHRoZSBmaWxlIHN0dWZmIG9uIEVOT1RESVJcbi8vXG4vLyBCb3RoIHJlc3VsdCBpbiBhbiBleHRyYSBzeXNjYWxsIHdoZW4geW91IGd1ZXNzIHdyb25nLiAgSG93ZXZlciwgdGhlcmVcbi8vIGFyZSBsaWtlbHkgZmFyIG1vcmUgbm9ybWFsIGZpbGVzIGluIHRoZSB3b3JsZCB0aGFuIGRpcmVjdG9yaWVzLiAgVGhpc1xuLy8gaXMgYmFzZWQgb24gdGhlIGFzc3VtcHRpb24gdGhhdCBhIHRoZSBhdmVyYWdlIG51bWJlciBvZiBmaWxlcyBwZXJcbi8vIGRpcmVjdG9yeSBpcyA+PSAxLlxuLy9cbi8vIElmIGFueW9uZSBldmVyIGNvbXBsYWlucyBhYm91dCB0aGlzLCB0aGVuIEkgZ3Vlc3MgdGhlIHN0cmF0ZWd5IGNvdWxkXG4vLyBiZSBtYWRlIGNvbmZpZ3VyYWJsZSBzb21laG93LiAgQnV0IHVudGlsIHRoZW4sIFlBR05JLlxuZnVuY3Rpb24gcmltcmFmXyAocCwgb3B0aW9ucywgY2IpIHtcbiAgYXNzZXJ0KHApXG4gIGFzc2VydChvcHRpb25zKVxuICBhc3NlcnQodHlwZW9mIGNiID09PSAnZnVuY3Rpb24nKVxuXG4gIC8vIHN1bm9zIGxldHMgdGhlIHJvb3QgdXNlciB1bmxpbmsgZGlyZWN0b3JpZXMsIHdoaWNoIGlzLi4uIHdlaXJkLlxuICAvLyBzbyB3ZSBoYXZlIHRvIGxzdGF0IGhlcmUgYW5kIG1ha2Ugc3VyZSBpdCdzIG5vdCBhIGRpci5cbiAgb3B0aW9ucy5sc3RhdChwLCAoZXIsIHN0KSA9PiB7XG4gICAgaWYgKGVyICYmIGVyLmNvZGUgPT09ICdFTk9FTlQnKSB7XG4gICAgICByZXR1cm4gY2IobnVsbClcbiAgICB9XG5cbiAgICAvLyBXaW5kb3dzIGNhbiBFUEVSTSBvbiBzdGF0LiAgTGlmZSBpcyBzdWZmZXJpbmcuXG4gICAgaWYgKGVyICYmIGVyLmNvZGUgPT09ICdFUEVSTScgJiYgaXNXaW5kb3dzKSB7XG4gICAgICByZXR1cm4gZml4V2luRVBFUk0ocCwgb3B0aW9ucywgZXIsIGNiKVxuICAgIH1cblxuICAgIGlmIChzdCAmJiBzdC5pc0RpcmVjdG9yeSgpKSB7XG4gICAgICByZXR1cm4gcm1kaXIocCwgb3B0aW9ucywgZXIsIGNiKVxuICAgIH1cblxuICAgIG9wdGlvbnMudW5saW5rKHAsIGVyID0+IHtcbiAgICAgIGlmIChlcikge1xuICAgICAgICBpZiAoZXIuY29kZSA9PT0gJ0VOT0VOVCcpIHtcbiAgICAgICAgICByZXR1cm4gY2IobnVsbClcbiAgICAgICAgfVxuICAgICAgICBpZiAoZXIuY29kZSA9PT0gJ0VQRVJNJykge1xuICAgICAgICAgIHJldHVybiAoaXNXaW5kb3dzKVxuICAgICAgICAgICAgPyBmaXhXaW5FUEVSTShwLCBvcHRpb25zLCBlciwgY2IpXG4gICAgICAgICAgICA6IHJtZGlyKHAsIG9wdGlvbnMsIGVyLCBjYilcbiAgICAgICAgfVxuICAgICAgICBpZiAoZXIuY29kZSA9PT0gJ0VJU0RJUicpIHtcbiAgICAgICAgICByZXR1cm4gcm1kaXIocCwgb3B0aW9ucywgZXIsIGNiKVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gY2IoZXIpXG4gICAgfSlcbiAgfSlcbn1cblxuZnVuY3Rpb24gZml4V2luRVBFUk0gKHAsIG9wdGlvbnMsIGVyLCBjYikge1xuICBhc3NlcnQocClcbiAgYXNzZXJ0KG9wdGlvbnMpXG4gIGFzc2VydCh0eXBlb2YgY2IgPT09ICdmdW5jdGlvbicpXG5cbiAgb3B0aW9ucy5jaG1vZChwLCAwbzY2NiwgZXIyID0+IHtcbiAgICBpZiAoZXIyKSB7XG4gICAgICBjYihlcjIuY29kZSA9PT0gJ0VOT0VOVCcgPyBudWxsIDogZXIpXG4gICAgfSBlbHNlIHtcbiAgICAgIG9wdGlvbnMuc3RhdChwLCAoZXIzLCBzdGF0cykgPT4ge1xuICAgICAgICBpZiAoZXIzKSB7XG4gICAgICAgICAgY2IoZXIzLmNvZGUgPT09ICdFTk9FTlQnID8gbnVsbCA6IGVyKVxuICAgICAgICB9IGVsc2UgaWYgKHN0YXRzLmlzRGlyZWN0b3J5KCkpIHtcbiAgICAgICAgICBybWRpcihwLCBvcHRpb25zLCBlciwgY2IpXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgb3B0aW9ucy51bmxpbmsocCwgY2IpXG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgfVxuICB9KVxufVxuXG5mdW5jdGlvbiBmaXhXaW5FUEVSTVN5bmMgKHAsIG9wdGlvbnMsIGVyKSB7XG4gIGxldCBzdGF0c1xuXG4gIGFzc2VydChwKVxuICBhc3NlcnQob3B0aW9ucylcblxuICB0cnkge1xuICAgIG9wdGlvbnMuY2htb2RTeW5jKHAsIDBvNjY2KVxuICB9IGNhdGNoIChlcjIpIHtcbiAgICBpZiAoZXIyLmNvZGUgPT09ICdFTk9FTlQnKSB7XG4gICAgICByZXR1cm5cbiAgICB9IGVsc2Uge1xuICAgICAgdGhyb3cgZXJcbiAgICB9XG4gIH1cblxuICB0cnkge1xuICAgIHN0YXRzID0gb3B0aW9ucy5zdGF0U3luYyhwKVxuICB9IGNhdGNoIChlcjMpIHtcbiAgICBpZiAoZXIzLmNvZGUgPT09ICdFTk9FTlQnKSB7XG4gICAgICByZXR1cm5cbiAgICB9IGVsc2Uge1xuICAgICAgdGhyb3cgZXJcbiAgICB9XG4gIH1cblxuICBpZiAoc3RhdHMuaXNEaXJlY3RvcnkoKSkge1xuICAgIHJtZGlyU3luYyhwLCBvcHRpb25zLCBlcilcbiAgfSBlbHNlIHtcbiAgICBvcHRpb25zLnVubGlua1N5bmMocClcbiAgfVxufVxuXG5mdW5jdGlvbiBybWRpciAocCwgb3B0aW9ucywgb3JpZ2luYWxFciwgY2IpIHtcbiAgYXNzZXJ0KHApXG4gIGFzc2VydChvcHRpb25zKVxuICBhc3NlcnQodHlwZW9mIGNiID09PSAnZnVuY3Rpb24nKVxuXG4gIC8vIHRyeSB0byBybWRpciBmaXJzdCwgYW5kIG9ubHkgcmVhZGRpciBvbiBFTk9URU1QVFkgb3IgRUVYSVNUIChTdW5PUylcbiAgLy8gaWYgd2UgZ3Vlc3NlZCB3cm9uZywgYW5kIGl0J3Mgbm90IGEgZGlyZWN0b3J5LCB0aGVuXG4gIC8vIHJhaXNlIHRoZSBvcmlnaW5hbCBlcnJvci5cbiAgb3B0aW9ucy5ybWRpcihwLCBlciA9PiB7XG4gICAgaWYgKGVyICYmIChlci5jb2RlID09PSAnRU5PVEVNUFRZJyB8fCBlci5jb2RlID09PSAnRUVYSVNUJyB8fCBlci5jb2RlID09PSAnRVBFUk0nKSkge1xuICAgICAgcm1raWRzKHAsIG9wdGlvbnMsIGNiKVxuICAgIH0gZWxzZSBpZiAoZXIgJiYgZXIuY29kZSA9PT0gJ0VOT1RESVInKSB7XG4gICAgICBjYihvcmlnaW5hbEVyKVxuICAgIH0gZWxzZSB7XG4gICAgICBjYihlcilcbiAgICB9XG4gIH0pXG59XG5cbmZ1bmN0aW9uIHJta2lkcyAocCwgb3B0aW9ucywgY2IpIHtcbiAgYXNzZXJ0KHApXG4gIGFzc2VydChvcHRpb25zKVxuICBhc3NlcnQodHlwZW9mIGNiID09PSAnZnVuY3Rpb24nKVxuXG4gIG9wdGlvbnMucmVhZGRpcihwLCAoZXIsIGZpbGVzKSA9PiB7XG4gICAgaWYgKGVyKSByZXR1cm4gY2IoZXIpXG5cbiAgICBsZXQgbiA9IGZpbGVzLmxlbmd0aFxuICAgIGxldCBlcnJTdGF0ZVxuXG4gICAgaWYgKG4gPT09IDApIHJldHVybiBvcHRpb25zLnJtZGlyKHAsIGNiKVxuXG4gICAgZmlsZXMuZm9yRWFjaChmID0+IHtcbiAgICAgIHJpbXJhZihwYXRoLmpvaW4ocCwgZiksIG9wdGlvbnMsIGVyID0+IHtcbiAgICAgICAgaWYgKGVyclN0YXRlKSB7XG4gICAgICAgICAgcmV0dXJuXG4gICAgICAgIH1cbiAgICAgICAgaWYgKGVyKSByZXR1cm4gY2IoZXJyU3RhdGUgPSBlcilcbiAgICAgICAgaWYgKC0tbiA9PT0gMCkge1xuICAgICAgICAgIG9wdGlvbnMucm1kaXIocCwgY2IpXG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgfSlcbiAgfSlcbn1cblxuLy8gdGhpcyBsb29rcyBzaW1wbGVyLCBhbmQgaXMgc3RyaWN0bHkgKmZhc3RlciosIGJ1dCB3aWxsXG4vLyB0aWUgdXAgdGhlIEphdmFTY3JpcHQgdGhyZWFkIGFuZCBmYWlsIG9uIGV4Y2Vzc2l2ZWx5XG4vLyBkZWVwIGRpcmVjdG9yeSB0cmVlcy5cbmZ1bmN0aW9uIHJpbXJhZlN5bmMgKHAsIG9wdGlvbnMpIHtcbiAgbGV0IHN0XG5cbiAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge31cbiAgZGVmYXVsdHMob3B0aW9ucylcblxuICBhc3NlcnQocCwgJ3JpbXJhZjogbWlzc2luZyBwYXRoJylcbiAgYXNzZXJ0LnN0cmljdEVxdWFsKHR5cGVvZiBwLCAnc3RyaW5nJywgJ3JpbXJhZjogcGF0aCBzaG91bGQgYmUgYSBzdHJpbmcnKVxuICBhc3NlcnQob3B0aW9ucywgJ3JpbXJhZjogbWlzc2luZyBvcHRpb25zJylcbiAgYXNzZXJ0LnN0cmljdEVxdWFsKHR5cGVvZiBvcHRpb25zLCAnb2JqZWN0JywgJ3JpbXJhZjogb3B0aW9ucyBzaG91bGQgYmUgb2JqZWN0JylcblxuICB0cnkge1xuICAgIHN0ID0gb3B0aW9ucy5sc3RhdFN5bmMocClcbiAgfSBjYXRjaCAoZXIpIHtcbiAgICBpZiAoZXIuY29kZSA9PT0gJ0VOT0VOVCcpIHtcbiAgICAgIHJldHVyblxuICAgIH1cblxuICAgIC8vIFdpbmRvd3MgY2FuIEVQRVJNIG9uIHN0YXQuICBMaWZlIGlzIHN1ZmZlcmluZy5cbiAgICBpZiAoZXIuY29kZSA9PT0gJ0VQRVJNJyAmJiBpc1dpbmRvd3MpIHtcbiAgICAgIGZpeFdpbkVQRVJNU3luYyhwLCBvcHRpb25zLCBlcilcbiAgICB9XG4gIH1cblxuICB0cnkge1xuICAgIC8vIHN1bm9zIGxldHMgdGhlIHJvb3QgdXNlciB1bmxpbmsgZGlyZWN0b3JpZXMsIHdoaWNoIGlzLi4uIHdlaXJkLlxuICAgIGlmIChzdCAmJiBzdC5pc0RpcmVjdG9yeSgpKSB7XG4gICAgICBybWRpclN5bmMocCwgb3B0aW9ucywgbnVsbClcbiAgICB9IGVsc2Uge1xuICAgICAgb3B0aW9ucy51bmxpbmtTeW5jKHApXG4gICAgfVxuICB9IGNhdGNoIChlcikge1xuICAgIGlmIChlci5jb2RlID09PSAnRU5PRU5UJykge1xuICAgICAgcmV0dXJuXG4gICAgfSBlbHNlIGlmIChlci5jb2RlID09PSAnRVBFUk0nKSB7XG4gICAgICByZXR1cm4gaXNXaW5kb3dzID8gZml4V2luRVBFUk1TeW5jKHAsIG9wdGlvbnMsIGVyKSA6IHJtZGlyU3luYyhwLCBvcHRpb25zLCBlcilcbiAgICB9IGVsc2UgaWYgKGVyLmNvZGUgIT09ICdFSVNESVInKSB7XG4gICAgICB0aHJvdyBlclxuICAgIH1cbiAgICBybWRpclN5bmMocCwgb3B0aW9ucywgZXIpXG4gIH1cbn1cblxuZnVuY3Rpb24gcm1kaXJTeW5jIChwLCBvcHRpb25zLCBvcmlnaW5hbEVyKSB7XG4gIGFzc2VydChwKVxuICBhc3NlcnQob3B0aW9ucylcblxuICB0cnkge1xuICAgIG9wdGlvbnMucm1kaXJTeW5jKHApXG4gIH0gY2F0Y2ggKGVyKSB7XG4gICAgaWYgKGVyLmNvZGUgPT09ICdFTk9URElSJykge1xuICAgICAgdGhyb3cgb3JpZ2luYWxFclxuICAgIH0gZWxzZSBpZiAoZXIuY29kZSA9PT0gJ0VOT1RFTVBUWScgfHwgZXIuY29kZSA9PT0gJ0VFWElTVCcgfHwgZXIuY29kZSA9PT0gJ0VQRVJNJykge1xuICAgICAgcm1raWRzU3luYyhwLCBvcHRpb25zKVxuICAgIH0gZWxzZSBpZiAoZXIuY29kZSAhPT0gJ0VOT0VOVCcpIHtcbiAgICAgIHRocm93IGVyXG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIHJta2lkc1N5bmMgKHAsIG9wdGlvbnMpIHtcbiAgYXNzZXJ0KHApXG4gIGFzc2VydChvcHRpb25zKVxuICBvcHRpb25zLnJlYWRkaXJTeW5jKHApLmZvckVhY2goZiA9PiByaW1yYWZTeW5jKHBhdGguam9pbihwLCBmKSwgb3B0aW9ucykpXG5cbiAgaWYgKGlzV2luZG93cykge1xuICAgIC8vIFdlIG9ubHkgZW5kIHVwIGhlcmUgb25jZSB3ZSBnb3QgRU5PVEVNUFRZIGF0IGxlYXN0IG9uY2UsIGFuZFxuICAgIC8vIGF0IHRoaXMgcG9pbnQsIHdlIGFyZSBndWFyYW50ZWVkIHRvIGhhdmUgcmVtb3ZlZCBhbGwgdGhlIGtpZHMuXG4gICAgLy8gU28sIHdlIGtub3cgdGhhdCBpdCB3b24ndCBiZSBFTk9FTlQgb3IgRU5PVERJUiBvciBhbnl0aGluZyBlbHNlLlxuICAgIC8vIHRyeSByZWFsbHkgaGFyZCB0byBkZWxldGUgc3R1ZmYgb24gd2luZG93cywgYmVjYXVzZSBpdCBoYXMgYVxuICAgIC8vIFBST0ZPVU5ETFkgYW5ub3lpbmcgaGFiaXQgb2Ygbm90IGNsb3NpbmcgaGFuZGxlcyBwcm9tcHRseSB3aGVuXG4gICAgLy8gZmlsZXMgYXJlIGRlbGV0ZWQsIHJlc3VsdGluZyBpbiBzcHVyaW91cyBFTk9URU1QVFkgZXJyb3JzLlxuICAgIGNvbnN0IHN0YXJ0VGltZSA9IERhdGUubm93KClcbiAgICBkbyB7XG4gICAgICB0cnkge1xuICAgICAgICBjb25zdCByZXQgPSBvcHRpb25zLnJtZGlyU3luYyhwLCBvcHRpb25zKVxuICAgICAgICByZXR1cm4gcmV0XG4gICAgICB9IGNhdGNoIHt9XG4gICAgfSB3aGlsZSAoRGF0ZS5ub3coKSAtIHN0YXJ0VGltZSA8IDUwMCkgLy8gZ2l2ZSB1cCBhZnRlciA1MDBtc1xuICB9IGVsc2Uge1xuICAgIGNvbnN0IHJldCA9IG9wdGlvbnMucm1kaXJTeW5jKHAsIG9wdGlvbnMpXG4gICAgcmV0dXJuIHJldFxuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gcmltcmFmXG5yaW1yYWYuc3luYyA9IHJpbXJhZlN5bmNcbiIsIid1c2Ugc3RyaWN0J1xuXG5jb25zdCBmcyA9IHJlcXVpcmUoJy4uL2ZzJylcbmNvbnN0IHBhdGggPSByZXF1aXJlKCdwYXRoJylcbmNvbnN0IHV0aWwgPSByZXF1aXJlKCd1dGlsJylcblxuZnVuY3Rpb24gZ2V0U3RhdHMgKHNyYywgZGVzdCwgb3B0cykge1xuICBjb25zdCBzdGF0RnVuYyA9IG9wdHMuZGVyZWZlcmVuY2VcbiAgICA/IChmaWxlKSA9PiBmcy5zdGF0KGZpbGUsIHsgYmlnaW50OiB0cnVlIH0pXG4gICAgOiAoZmlsZSkgPT4gZnMubHN0YXQoZmlsZSwgeyBiaWdpbnQ6IHRydWUgfSlcbiAgcmV0dXJuIFByb21pc2UuYWxsKFtcbiAgICBzdGF0RnVuYyhzcmMpLFxuICAgIHN0YXRGdW5jKGRlc3QpLmNhdGNoKGVyciA9PiB7XG4gICAgICBpZiAoZXJyLmNvZGUgPT09ICdFTk9FTlQnKSByZXR1cm4gbnVsbFxuICAgICAgdGhyb3cgZXJyXG4gICAgfSlcbiAgXSkudGhlbigoW3NyY1N0YXQsIGRlc3RTdGF0XSkgPT4gKHsgc3JjU3RhdCwgZGVzdFN0YXQgfSkpXG59XG5cbmZ1bmN0aW9uIGdldFN0YXRzU3luYyAoc3JjLCBkZXN0LCBvcHRzKSB7XG4gIGxldCBkZXN0U3RhdFxuICBjb25zdCBzdGF0RnVuYyA9IG9wdHMuZGVyZWZlcmVuY2VcbiAgICA/IChmaWxlKSA9PiBmcy5zdGF0U3luYyhmaWxlLCB7IGJpZ2ludDogdHJ1ZSB9KVxuICAgIDogKGZpbGUpID0+IGZzLmxzdGF0U3luYyhmaWxlLCB7IGJpZ2ludDogdHJ1ZSB9KVxuICBjb25zdCBzcmNTdGF0ID0gc3RhdEZ1bmMoc3JjKVxuICB0cnkge1xuICAgIGRlc3RTdGF0ID0gc3RhdEZ1bmMoZGVzdClcbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgaWYgKGVyci5jb2RlID09PSAnRU5PRU5UJykgcmV0dXJuIHsgc3JjU3RhdCwgZGVzdFN0YXQ6IG51bGwgfVxuICAgIHRocm93IGVyclxuICB9XG4gIHJldHVybiB7IHNyY1N0YXQsIGRlc3RTdGF0IH1cbn1cblxuZnVuY3Rpb24gY2hlY2tQYXRocyAoc3JjLCBkZXN0LCBmdW5jTmFtZSwgb3B0cywgY2IpIHtcbiAgdXRpbC5jYWxsYmFja2lmeShnZXRTdGF0cykoc3JjLCBkZXN0LCBvcHRzLCAoZXJyLCBzdGF0cykgPT4ge1xuICAgIGlmIChlcnIpIHJldHVybiBjYihlcnIpXG4gICAgY29uc3QgeyBzcmNTdGF0LCBkZXN0U3RhdCB9ID0gc3RhdHNcblxuICAgIGlmIChkZXN0U3RhdCkge1xuICAgICAgaWYgKGFyZUlkZW50aWNhbChzcmNTdGF0LCBkZXN0U3RhdCkpIHtcbiAgICAgICAgY29uc3Qgc3JjQmFzZU5hbWUgPSBwYXRoLmJhc2VuYW1lKHNyYylcbiAgICAgICAgY29uc3QgZGVzdEJhc2VOYW1lID0gcGF0aC5iYXNlbmFtZShkZXN0KVxuICAgICAgICBpZiAoZnVuY05hbWUgPT09ICdtb3ZlJyAmJlxuICAgICAgICAgIHNyY0Jhc2VOYW1lICE9PSBkZXN0QmFzZU5hbWUgJiZcbiAgICAgICAgICBzcmNCYXNlTmFtZS50b0xvd2VyQ2FzZSgpID09PSBkZXN0QmFzZU5hbWUudG9Mb3dlckNhc2UoKSkge1xuICAgICAgICAgIHJldHVybiBjYihudWxsLCB7IHNyY1N0YXQsIGRlc3RTdGF0LCBpc0NoYW5naW5nQ2FzZTogdHJ1ZSB9KVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBjYihuZXcgRXJyb3IoJ1NvdXJjZSBhbmQgZGVzdGluYXRpb24gbXVzdCBub3QgYmUgdGhlIHNhbWUuJykpXG4gICAgICB9XG4gICAgICBpZiAoc3JjU3RhdC5pc0RpcmVjdG9yeSgpICYmICFkZXN0U3RhdC5pc0RpcmVjdG9yeSgpKSB7XG4gICAgICAgIHJldHVybiBjYihuZXcgRXJyb3IoYENhbm5vdCBvdmVyd3JpdGUgbm9uLWRpcmVjdG9yeSAnJHtkZXN0fScgd2l0aCBkaXJlY3RvcnkgJyR7c3JjfScuYCkpXG4gICAgICB9XG4gICAgICBpZiAoIXNyY1N0YXQuaXNEaXJlY3RvcnkoKSAmJiBkZXN0U3RhdC5pc0RpcmVjdG9yeSgpKSB7XG4gICAgICAgIHJldHVybiBjYihuZXcgRXJyb3IoYENhbm5vdCBvdmVyd3JpdGUgZGlyZWN0b3J5ICcke2Rlc3R9JyB3aXRoIG5vbi1kaXJlY3RvcnkgJyR7c3JjfScuYCkpXG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKHNyY1N0YXQuaXNEaXJlY3RvcnkoKSAmJiBpc1NyY1N1YmRpcihzcmMsIGRlc3QpKSB7XG4gICAgICByZXR1cm4gY2IobmV3IEVycm9yKGVyck1zZyhzcmMsIGRlc3QsIGZ1bmNOYW1lKSkpXG4gICAgfVxuICAgIHJldHVybiBjYihudWxsLCB7IHNyY1N0YXQsIGRlc3RTdGF0IH0pXG4gIH0pXG59XG5cbmZ1bmN0aW9uIGNoZWNrUGF0aHNTeW5jIChzcmMsIGRlc3QsIGZ1bmNOYW1lLCBvcHRzKSB7XG4gIGNvbnN0IHsgc3JjU3RhdCwgZGVzdFN0YXQgfSA9IGdldFN0YXRzU3luYyhzcmMsIGRlc3QsIG9wdHMpXG5cbiAgaWYgKGRlc3RTdGF0KSB7XG4gICAgaWYgKGFyZUlkZW50aWNhbChzcmNTdGF0LCBkZXN0U3RhdCkpIHtcbiAgICAgIGNvbnN0IHNyY0Jhc2VOYW1lID0gcGF0aC5iYXNlbmFtZShzcmMpXG4gICAgICBjb25zdCBkZXN0QmFzZU5hbWUgPSBwYXRoLmJhc2VuYW1lKGRlc3QpXG4gICAgICBpZiAoZnVuY05hbWUgPT09ICdtb3ZlJyAmJlxuICAgICAgICBzcmNCYXNlTmFtZSAhPT0gZGVzdEJhc2VOYW1lICYmXG4gICAgICAgIHNyY0Jhc2VOYW1lLnRvTG93ZXJDYXNlKCkgPT09IGRlc3RCYXNlTmFtZS50b0xvd2VyQ2FzZSgpKSB7XG4gICAgICAgIHJldHVybiB7IHNyY1N0YXQsIGRlc3RTdGF0LCBpc0NoYW5naW5nQ2FzZTogdHJ1ZSB9XG4gICAgICB9XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1NvdXJjZSBhbmQgZGVzdGluYXRpb24gbXVzdCBub3QgYmUgdGhlIHNhbWUuJylcbiAgICB9XG4gICAgaWYgKHNyY1N0YXQuaXNEaXJlY3RvcnkoKSAmJiAhZGVzdFN0YXQuaXNEaXJlY3RvcnkoKSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBDYW5ub3Qgb3ZlcndyaXRlIG5vbi1kaXJlY3RvcnkgJyR7ZGVzdH0nIHdpdGggZGlyZWN0b3J5ICcke3NyY30nLmApXG4gICAgfVxuICAgIGlmICghc3JjU3RhdC5pc0RpcmVjdG9yeSgpICYmIGRlc3RTdGF0LmlzRGlyZWN0b3J5KCkpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgQ2Fubm90IG92ZXJ3cml0ZSBkaXJlY3RvcnkgJyR7ZGVzdH0nIHdpdGggbm9uLWRpcmVjdG9yeSAnJHtzcmN9Jy5gKVxuICAgIH1cbiAgfVxuXG4gIGlmIChzcmNTdGF0LmlzRGlyZWN0b3J5KCkgJiYgaXNTcmNTdWJkaXIoc3JjLCBkZXN0KSkge1xuICAgIHRocm93IG5ldyBFcnJvcihlcnJNc2coc3JjLCBkZXN0LCBmdW5jTmFtZSkpXG4gIH1cbiAgcmV0dXJuIHsgc3JjU3RhdCwgZGVzdFN0YXQgfVxufVxuXG4vLyByZWN1cnNpdmVseSBjaGVjayBpZiBkZXN0IHBhcmVudCBpcyBhIHN1YmRpcmVjdG9yeSBvZiBzcmMuXG4vLyBJdCB3b3JrcyBmb3IgYWxsIGZpbGUgdHlwZXMgaW5jbHVkaW5nIHN5bWxpbmtzIHNpbmNlIGl0XG4vLyBjaGVja3MgdGhlIHNyYyBhbmQgZGVzdCBpbm9kZXMuIEl0IHN0YXJ0cyBmcm9tIHRoZSBkZWVwZXN0XG4vLyBwYXJlbnQgYW5kIHN0b3BzIG9uY2UgaXQgcmVhY2hlcyB0aGUgc3JjIHBhcmVudCBvciB0aGUgcm9vdCBwYXRoLlxuZnVuY3Rpb24gY2hlY2tQYXJlbnRQYXRocyAoc3JjLCBzcmNTdGF0LCBkZXN0LCBmdW5jTmFtZSwgY2IpIHtcbiAgY29uc3Qgc3JjUGFyZW50ID0gcGF0aC5yZXNvbHZlKHBhdGguZGlybmFtZShzcmMpKVxuICBjb25zdCBkZXN0UGFyZW50ID0gcGF0aC5yZXNvbHZlKHBhdGguZGlybmFtZShkZXN0KSlcbiAgaWYgKGRlc3RQYXJlbnQgPT09IHNyY1BhcmVudCB8fCBkZXN0UGFyZW50ID09PSBwYXRoLnBhcnNlKGRlc3RQYXJlbnQpLnJvb3QpIHJldHVybiBjYigpXG4gIGZzLnN0YXQoZGVzdFBhcmVudCwgeyBiaWdpbnQ6IHRydWUgfSwgKGVyciwgZGVzdFN0YXQpID0+IHtcbiAgICBpZiAoZXJyKSB7XG4gICAgICBpZiAoZXJyLmNvZGUgPT09ICdFTk9FTlQnKSByZXR1cm4gY2IoKVxuICAgICAgcmV0dXJuIGNiKGVycilcbiAgICB9XG4gICAgaWYgKGFyZUlkZW50aWNhbChzcmNTdGF0LCBkZXN0U3RhdCkpIHtcbiAgICAgIHJldHVybiBjYihuZXcgRXJyb3IoZXJyTXNnKHNyYywgZGVzdCwgZnVuY05hbWUpKSlcbiAgICB9XG4gICAgcmV0dXJuIGNoZWNrUGFyZW50UGF0aHMoc3JjLCBzcmNTdGF0LCBkZXN0UGFyZW50LCBmdW5jTmFtZSwgY2IpXG4gIH0pXG59XG5cbmZ1bmN0aW9uIGNoZWNrUGFyZW50UGF0aHNTeW5jIChzcmMsIHNyY1N0YXQsIGRlc3QsIGZ1bmNOYW1lKSB7XG4gIGNvbnN0IHNyY1BhcmVudCA9IHBhdGgucmVzb2x2ZShwYXRoLmRpcm5hbWUoc3JjKSlcbiAgY29uc3QgZGVzdFBhcmVudCA9IHBhdGgucmVzb2x2ZShwYXRoLmRpcm5hbWUoZGVzdCkpXG4gIGlmIChkZXN0UGFyZW50ID09PSBzcmNQYXJlbnQgfHwgZGVzdFBhcmVudCA9PT0gcGF0aC5wYXJzZShkZXN0UGFyZW50KS5yb290KSByZXR1cm5cbiAgbGV0IGRlc3RTdGF0XG4gIHRyeSB7XG4gICAgZGVzdFN0YXQgPSBmcy5zdGF0U3luYyhkZXN0UGFyZW50LCB7IGJpZ2ludDogdHJ1ZSB9KVxuICB9IGNhdGNoIChlcnIpIHtcbiAgICBpZiAoZXJyLmNvZGUgPT09ICdFTk9FTlQnKSByZXR1cm5cbiAgICB0aHJvdyBlcnJcbiAgfVxuICBpZiAoYXJlSWRlbnRpY2FsKHNyY1N0YXQsIGRlc3RTdGF0KSkge1xuICAgIHRocm93IG5ldyBFcnJvcihlcnJNc2coc3JjLCBkZXN0LCBmdW5jTmFtZSkpXG4gIH1cbiAgcmV0dXJuIGNoZWNrUGFyZW50UGF0aHNTeW5jKHNyYywgc3JjU3RhdCwgZGVzdFBhcmVudCwgZnVuY05hbWUpXG59XG5cbmZ1bmN0aW9uIGFyZUlkZW50aWNhbCAoc3JjU3RhdCwgZGVzdFN0YXQpIHtcbiAgcmV0dXJuIGRlc3RTdGF0LmlubyAmJiBkZXN0U3RhdC5kZXYgJiYgZGVzdFN0YXQuaW5vID09PSBzcmNTdGF0LmlubyAmJiBkZXN0U3RhdC5kZXYgPT09IHNyY1N0YXQuZGV2XG59XG5cbi8vIHJldHVybiB0cnVlIGlmIGRlc3QgaXMgYSBzdWJkaXIgb2Ygc3JjLCBvdGhlcndpc2UgZmFsc2UuXG4vLyBJdCBvbmx5IGNoZWNrcyB0aGUgcGF0aCBzdHJpbmdzLlxuZnVuY3Rpb24gaXNTcmNTdWJkaXIgKHNyYywgZGVzdCkge1xuICBjb25zdCBzcmNBcnIgPSBwYXRoLnJlc29sdmUoc3JjKS5zcGxpdChwYXRoLnNlcCkuZmlsdGVyKGkgPT4gaSlcbiAgY29uc3QgZGVzdEFyciA9IHBhdGgucmVzb2x2ZShkZXN0KS5zcGxpdChwYXRoLnNlcCkuZmlsdGVyKGkgPT4gaSlcbiAgcmV0dXJuIHNyY0Fyci5yZWR1Y2UoKGFjYywgY3VyLCBpKSA9PiBhY2MgJiYgZGVzdEFycltpXSA9PT0gY3VyLCB0cnVlKVxufVxuXG5mdW5jdGlvbiBlcnJNc2cgKHNyYywgZGVzdCwgZnVuY05hbWUpIHtcbiAgcmV0dXJuIGBDYW5ub3QgJHtmdW5jTmFtZX0gJyR7c3JjfScgdG8gYSBzdWJkaXJlY3Rvcnkgb2YgaXRzZWxmLCAnJHtkZXN0fScuYFxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgY2hlY2tQYXRocyxcbiAgY2hlY2tQYXRoc1N5bmMsXG4gIGNoZWNrUGFyZW50UGF0aHMsXG4gIGNoZWNrUGFyZW50UGF0aHNTeW5jLFxuICBpc1NyY1N1YmRpcixcbiAgYXJlSWRlbnRpY2FsXG59XG4iLCIndXNlIHN0cmljdCdcblxuY29uc3QgZnMgPSByZXF1aXJlKCdncmFjZWZ1bC1mcycpXG5cbmZ1bmN0aW9uIHV0aW1lc01pbGxpcyAocGF0aCwgYXRpbWUsIG10aW1lLCBjYWxsYmFjaykge1xuICAvLyBpZiAoIUhBU19NSUxMSVNfUkVTKSByZXR1cm4gZnMudXRpbWVzKHBhdGgsIGF0aW1lLCBtdGltZSwgY2FsbGJhY2spXG4gIGZzLm9wZW4ocGF0aCwgJ3IrJywgKGVyciwgZmQpID0+IHtcbiAgICBpZiAoZXJyKSByZXR1cm4gY2FsbGJhY2soZXJyKVxuICAgIGZzLmZ1dGltZXMoZmQsIGF0aW1lLCBtdGltZSwgZnV0aW1lc0VyciA9PiB7XG4gICAgICBmcy5jbG9zZShmZCwgY2xvc2VFcnIgPT4ge1xuICAgICAgICBpZiAoY2FsbGJhY2spIGNhbGxiYWNrKGZ1dGltZXNFcnIgfHwgY2xvc2VFcnIpXG4gICAgICB9KVxuICAgIH0pXG4gIH0pXG59XG5cbmZ1bmN0aW9uIHV0aW1lc01pbGxpc1N5bmMgKHBhdGgsIGF0aW1lLCBtdGltZSkge1xuICBjb25zdCBmZCA9IGZzLm9wZW5TeW5jKHBhdGgsICdyKycpXG4gIGZzLmZ1dGltZXNTeW5jKGZkLCBhdGltZSwgbXRpbWUpXG4gIHJldHVybiBmcy5jbG9zZVN5bmMoZmQpXG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICB1dGltZXNNaWxsaXMsXG4gIHV0aW1lc01pbGxpc1N5bmNcbn1cbiIsIid1c2Ugc3RyaWN0J1xuXG5tb2R1bGUuZXhwb3J0cyA9IGNsb25lXG5cbnZhciBnZXRQcm90b3R5cGVPZiA9IE9iamVjdC5nZXRQcm90b3R5cGVPZiB8fCBmdW5jdGlvbiAob2JqKSB7XG4gIHJldHVybiBvYmouX19wcm90b19fXG59XG5cbmZ1bmN0aW9uIGNsb25lIChvYmopIHtcbiAgaWYgKG9iaiA9PT0gbnVsbCB8fCB0eXBlb2Ygb2JqICE9PSAnb2JqZWN0JylcbiAgICByZXR1cm4gb2JqXG5cbiAgaWYgKG9iaiBpbnN0YW5jZW9mIE9iamVjdClcbiAgICB2YXIgY29weSA9IHsgX19wcm90b19fOiBnZXRQcm90b3R5cGVPZihvYmopIH1cbiAgZWxzZVxuICAgIHZhciBjb3B5ID0gT2JqZWN0LmNyZWF0ZShudWxsKVxuXG4gIE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzKG9iaikuZm9yRWFjaChmdW5jdGlvbiAoa2V5KSB7XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KGNvcHksIGtleSwgT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcihvYmosIGtleSkpXG4gIH0pXG5cbiAgcmV0dXJuIGNvcHlcbn1cbiIsInZhciBmcyA9IHJlcXVpcmUoJ2ZzJylcbnZhciBwb2x5ZmlsbHMgPSByZXF1aXJlKCcuL3BvbHlmaWxscy5qcycpXG52YXIgbGVnYWN5ID0gcmVxdWlyZSgnLi9sZWdhY3ktc3RyZWFtcy5qcycpXG52YXIgY2xvbmUgPSByZXF1aXJlKCcuL2Nsb25lLmpzJylcblxudmFyIHV0aWwgPSByZXF1aXJlKCd1dGlsJylcblxuLyogaXN0YW5idWwgaWdub3JlIG5leHQgLSBub2RlIDAueCBwb2x5ZmlsbCAqL1xudmFyIGdyYWNlZnVsUXVldWVcbnZhciBwcmV2aW91c1N5bWJvbFxuXG4vKiBpc3RhbmJ1bCBpZ25vcmUgZWxzZSAtIG5vZGUgMC54IHBvbHlmaWxsICovXG5pZiAodHlwZW9mIFN5bWJvbCA9PT0gJ2Z1bmN0aW9uJyAmJiB0eXBlb2YgU3ltYm9sLmZvciA9PT0gJ2Z1bmN0aW9uJykge1xuICBncmFjZWZ1bFF1ZXVlID0gU3ltYm9sLmZvcignZ3JhY2VmdWwtZnMucXVldWUnKVxuICAvLyBUaGlzIGlzIHVzZWQgaW4gdGVzdGluZyBieSBmdXR1cmUgdmVyc2lvbnNcbiAgcHJldmlvdXNTeW1ib2wgPSBTeW1ib2wuZm9yKCdncmFjZWZ1bC1mcy5wcmV2aW91cycpXG59IGVsc2Uge1xuICBncmFjZWZ1bFF1ZXVlID0gJ19fX2dyYWNlZnVsLWZzLnF1ZXVlJ1xuICBwcmV2aW91c1N5bWJvbCA9ICdfX19ncmFjZWZ1bC1mcy5wcmV2aW91cydcbn1cblxuZnVuY3Rpb24gbm9vcCAoKSB7fVxuXG5mdW5jdGlvbiBwdWJsaXNoUXVldWUoY29udGV4dCwgcXVldWUpIHtcbiAgT2JqZWN0LmRlZmluZVByb3BlcnR5KGNvbnRleHQsIGdyYWNlZnVsUXVldWUsIHtcbiAgICBnZXQ6IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIHF1ZXVlXG4gICAgfVxuICB9KVxufVxuXG52YXIgZGVidWcgPSBub29wXG5pZiAodXRpbC5kZWJ1Z2xvZylcbiAgZGVidWcgPSB1dGlsLmRlYnVnbG9nKCdnZnM0JylcbmVsc2UgaWYgKC9cXGJnZnM0XFxiL2kudGVzdChwcm9jZXNzLmVudi5OT0RFX0RFQlVHIHx8ICcnKSlcbiAgZGVidWcgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgbSA9IHV0aWwuZm9ybWF0LmFwcGx5KHV0aWwsIGFyZ3VtZW50cylcbiAgICBtID0gJ0dGUzQ6ICcgKyBtLnNwbGl0KC9cXG4vKS5qb2luKCdcXG5HRlM0OiAnKVxuICAgIGNvbnNvbGUuZXJyb3IobSlcbiAgfVxuXG4vLyBPbmNlIHRpbWUgaW5pdGlhbGl6YXRpb25cbmlmICghZnNbZ3JhY2VmdWxRdWV1ZV0pIHtcbiAgLy8gVGhpcyBxdWV1ZSBjYW4gYmUgc2hhcmVkIGJ5IG11bHRpcGxlIGxvYWRlZCBpbnN0YW5jZXNcbiAgdmFyIHF1ZXVlID0gZ2xvYmFsW2dyYWNlZnVsUXVldWVdIHx8IFtdXG4gIHB1Ymxpc2hRdWV1ZShmcywgcXVldWUpXG5cbiAgLy8gUGF0Y2ggZnMuY2xvc2UvY2xvc2VTeW5jIHRvIHNoYXJlZCBxdWV1ZSB2ZXJzaW9uLCBiZWNhdXNlIHdlIG5lZWRcbiAgLy8gdG8gcmV0cnkoKSB3aGVuZXZlciBhIGNsb3NlIGhhcHBlbnMgKmFueXdoZXJlKiBpbiB0aGUgcHJvZ3JhbS5cbiAgLy8gVGhpcyBpcyBlc3NlbnRpYWwgd2hlbiBtdWx0aXBsZSBncmFjZWZ1bC1mcyBpbnN0YW5jZXMgYXJlXG4gIC8vIGluIHBsYXkgYXQgdGhlIHNhbWUgdGltZS5cbiAgZnMuY2xvc2UgPSAoZnVuY3Rpb24gKGZzJGNsb3NlKSB7XG4gICAgZnVuY3Rpb24gY2xvc2UgKGZkLCBjYikge1xuICAgICAgcmV0dXJuIGZzJGNsb3NlLmNhbGwoZnMsIGZkLCBmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgIC8vIFRoaXMgZnVuY3Rpb24gdXNlcyB0aGUgZ3JhY2VmdWwtZnMgc2hhcmVkIHF1ZXVlXG4gICAgICAgIGlmICghZXJyKSB7XG4gICAgICAgICAgcmVzZXRRdWV1ZSgpXG4gICAgICAgIH1cblxuICAgICAgICBpZiAodHlwZW9mIGNiID09PSAnZnVuY3Rpb24nKVxuICAgICAgICAgIGNiLmFwcGx5KHRoaXMsIGFyZ3VtZW50cylcbiAgICAgIH0pXG4gICAgfVxuXG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KGNsb3NlLCBwcmV2aW91c1N5bWJvbCwge1xuICAgICAgdmFsdWU6IGZzJGNsb3NlXG4gICAgfSlcbiAgICByZXR1cm4gY2xvc2VcbiAgfSkoZnMuY2xvc2UpXG5cbiAgZnMuY2xvc2VTeW5jID0gKGZ1bmN0aW9uIChmcyRjbG9zZVN5bmMpIHtcbiAgICBmdW5jdGlvbiBjbG9zZVN5bmMgKGZkKSB7XG4gICAgICAvLyBUaGlzIGZ1bmN0aW9uIHVzZXMgdGhlIGdyYWNlZnVsLWZzIHNoYXJlZCBxdWV1ZVxuICAgICAgZnMkY2xvc2VTeW5jLmFwcGx5KGZzLCBhcmd1bWVudHMpXG4gICAgICByZXNldFF1ZXVlKClcbiAgICB9XG5cbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoY2xvc2VTeW5jLCBwcmV2aW91c1N5bWJvbCwge1xuICAgICAgdmFsdWU6IGZzJGNsb3NlU3luY1xuICAgIH0pXG4gICAgcmV0dXJuIGNsb3NlU3luY1xuICB9KShmcy5jbG9zZVN5bmMpXG5cbiAgaWYgKC9cXGJnZnM0XFxiL2kudGVzdChwcm9jZXNzLmVudi5OT0RFX0RFQlVHIHx8ICcnKSkge1xuICAgIHByb2Nlc3Mub24oJ2V4aXQnLCBmdW5jdGlvbigpIHtcbiAgICAgIGRlYnVnKGZzW2dyYWNlZnVsUXVldWVdKVxuICAgICAgcmVxdWlyZSgnYXNzZXJ0JykuZXF1YWwoZnNbZ3JhY2VmdWxRdWV1ZV0ubGVuZ3RoLCAwKVxuICAgIH0pXG4gIH1cbn1cblxuaWYgKCFnbG9iYWxbZ3JhY2VmdWxRdWV1ZV0pIHtcbiAgcHVibGlzaFF1ZXVlKGdsb2JhbCwgZnNbZ3JhY2VmdWxRdWV1ZV0pO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHBhdGNoKGNsb25lKGZzKSlcbmlmIChwcm9jZXNzLmVudi5URVNUX0dSQUNFRlVMX0ZTX0dMT0JBTF9QQVRDSCAmJiAhZnMuX19wYXRjaGVkKSB7XG4gICAgbW9kdWxlLmV4cG9ydHMgPSBwYXRjaChmcylcbiAgICBmcy5fX3BhdGNoZWQgPSB0cnVlO1xufVxuXG5mdW5jdGlvbiBwYXRjaCAoZnMpIHtcbiAgLy8gRXZlcnl0aGluZyB0aGF0IHJlZmVyZW5jZXMgdGhlIG9wZW4oKSBmdW5jdGlvbiBuZWVkcyB0byBiZSBpbiBoZXJlXG4gIHBvbHlmaWxscyhmcylcbiAgZnMuZ3JhY2VmdWxpZnkgPSBwYXRjaFxuXG4gIGZzLmNyZWF0ZVJlYWRTdHJlYW0gPSBjcmVhdGVSZWFkU3RyZWFtXG4gIGZzLmNyZWF0ZVdyaXRlU3RyZWFtID0gY3JlYXRlV3JpdGVTdHJlYW1cbiAgdmFyIGZzJHJlYWRGaWxlID0gZnMucmVhZEZpbGVcbiAgZnMucmVhZEZpbGUgPSByZWFkRmlsZVxuICBmdW5jdGlvbiByZWFkRmlsZSAocGF0aCwgb3B0aW9ucywgY2IpIHtcbiAgICBpZiAodHlwZW9mIG9wdGlvbnMgPT09ICdmdW5jdGlvbicpXG4gICAgICBjYiA9IG9wdGlvbnMsIG9wdGlvbnMgPSBudWxsXG5cbiAgICByZXR1cm4gZ28kcmVhZEZpbGUocGF0aCwgb3B0aW9ucywgY2IpXG5cbiAgICBmdW5jdGlvbiBnbyRyZWFkRmlsZSAocGF0aCwgb3B0aW9ucywgY2IsIHN0YXJ0VGltZSkge1xuICAgICAgcmV0dXJuIGZzJHJlYWRGaWxlKHBhdGgsIG9wdGlvbnMsIGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICAgaWYgKGVyciAmJiAoZXJyLmNvZGUgPT09ICdFTUZJTEUnIHx8IGVyci5jb2RlID09PSAnRU5GSUxFJykpXG4gICAgICAgICAgZW5xdWV1ZShbZ28kcmVhZEZpbGUsIFtwYXRoLCBvcHRpb25zLCBjYl0sIGVyciwgc3RhcnRUaW1lIHx8IERhdGUubm93KCksIERhdGUubm93KCldKVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICBpZiAodHlwZW9mIGNiID09PSAnZnVuY3Rpb24nKVxuICAgICAgICAgICAgY2IuYXBwbHkodGhpcywgYXJndW1lbnRzKVxuICAgICAgICB9XG4gICAgICB9KVxuICAgIH1cbiAgfVxuXG4gIHZhciBmcyR3cml0ZUZpbGUgPSBmcy53cml0ZUZpbGVcbiAgZnMud3JpdGVGaWxlID0gd3JpdGVGaWxlXG4gIGZ1bmN0aW9uIHdyaXRlRmlsZSAocGF0aCwgZGF0YSwgb3B0aW9ucywgY2IpIHtcbiAgICBpZiAodHlwZW9mIG9wdGlvbnMgPT09ICdmdW5jdGlvbicpXG4gICAgICBjYiA9IG9wdGlvbnMsIG9wdGlvbnMgPSBudWxsXG5cbiAgICByZXR1cm4gZ28kd3JpdGVGaWxlKHBhdGgsIGRhdGEsIG9wdGlvbnMsIGNiKVxuXG4gICAgZnVuY3Rpb24gZ28kd3JpdGVGaWxlIChwYXRoLCBkYXRhLCBvcHRpb25zLCBjYiwgc3RhcnRUaW1lKSB7XG4gICAgICByZXR1cm4gZnMkd3JpdGVGaWxlKHBhdGgsIGRhdGEsIG9wdGlvbnMsIGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICAgaWYgKGVyciAmJiAoZXJyLmNvZGUgPT09ICdFTUZJTEUnIHx8IGVyci5jb2RlID09PSAnRU5GSUxFJykpXG4gICAgICAgICAgZW5xdWV1ZShbZ28kd3JpdGVGaWxlLCBbcGF0aCwgZGF0YSwgb3B0aW9ucywgY2JdLCBlcnIsIHN0YXJ0VGltZSB8fCBEYXRlLm5vdygpLCBEYXRlLm5vdygpXSlcbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgaWYgKHR5cGVvZiBjYiA9PT0gJ2Z1bmN0aW9uJylcbiAgICAgICAgICAgIGNiLmFwcGx5KHRoaXMsIGFyZ3VtZW50cylcbiAgICAgICAgfVxuICAgICAgfSlcbiAgICB9XG4gIH1cblxuICB2YXIgZnMkYXBwZW5kRmlsZSA9IGZzLmFwcGVuZEZpbGVcbiAgaWYgKGZzJGFwcGVuZEZpbGUpXG4gICAgZnMuYXBwZW5kRmlsZSA9IGFwcGVuZEZpbGVcbiAgZnVuY3Rpb24gYXBwZW5kRmlsZSAocGF0aCwgZGF0YSwgb3B0aW9ucywgY2IpIHtcbiAgICBpZiAodHlwZW9mIG9wdGlvbnMgPT09ICdmdW5jdGlvbicpXG4gICAgICBjYiA9IG9wdGlvbnMsIG9wdGlvbnMgPSBudWxsXG5cbiAgICByZXR1cm4gZ28kYXBwZW5kRmlsZShwYXRoLCBkYXRhLCBvcHRpb25zLCBjYilcblxuICAgIGZ1bmN0aW9uIGdvJGFwcGVuZEZpbGUgKHBhdGgsIGRhdGEsIG9wdGlvbnMsIGNiLCBzdGFydFRpbWUpIHtcbiAgICAgIHJldHVybiBmcyRhcHBlbmRGaWxlKHBhdGgsIGRhdGEsIG9wdGlvbnMsIGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICAgaWYgKGVyciAmJiAoZXJyLmNvZGUgPT09ICdFTUZJTEUnIHx8IGVyci5jb2RlID09PSAnRU5GSUxFJykpXG4gICAgICAgICAgZW5xdWV1ZShbZ28kYXBwZW5kRmlsZSwgW3BhdGgsIGRhdGEsIG9wdGlvbnMsIGNiXSwgZXJyLCBzdGFydFRpbWUgfHwgRGF0ZS5ub3coKSwgRGF0ZS5ub3coKV0pXG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgIGlmICh0eXBlb2YgY2IgPT09ICdmdW5jdGlvbicpXG4gICAgICAgICAgICBjYi5hcHBseSh0aGlzLCBhcmd1bWVudHMpXG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgfVxuICB9XG5cbiAgdmFyIGZzJGNvcHlGaWxlID0gZnMuY29weUZpbGVcbiAgaWYgKGZzJGNvcHlGaWxlKVxuICAgIGZzLmNvcHlGaWxlID0gY29weUZpbGVcbiAgZnVuY3Rpb24gY29weUZpbGUgKHNyYywgZGVzdCwgZmxhZ3MsIGNiKSB7XG4gICAgaWYgKHR5cGVvZiBmbGFncyA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgY2IgPSBmbGFnc1xuICAgICAgZmxhZ3MgPSAwXG4gICAgfVxuICAgIHJldHVybiBnbyRjb3B5RmlsZShzcmMsIGRlc3QsIGZsYWdzLCBjYilcblxuICAgIGZ1bmN0aW9uIGdvJGNvcHlGaWxlIChzcmMsIGRlc3QsIGZsYWdzLCBjYiwgc3RhcnRUaW1lKSB7XG4gICAgICByZXR1cm4gZnMkY29weUZpbGUoc3JjLCBkZXN0LCBmbGFncywgZnVuY3Rpb24gKGVycikge1xuICAgICAgICBpZiAoZXJyICYmIChlcnIuY29kZSA9PT0gJ0VNRklMRScgfHwgZXJyLmNvZGUgPT09ICdFTkZJTEUnKSlcbiAgICAgICAgICBlbnF1ZXVlKFtnbyRjb3B5RmlsZSwgW3NyYywgZGVzdCwgZmxhZ3MsIGNiXSwgZXJyLCBzdGFydFRpbWUgfHwgRGF0ZS5ub3coKSwgRGF0ZS5ub3coKV0pXG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgIGlmICh0eXBlb2YgY2IgPT09ICdmdW5jdGlvbicpXG4gICAgICAgICAgICBjYi5hcHBseSh0aGlzLCBhcmd1bWVudHMpXG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgfVxuICB9XG5cbiAgdmFyIGZzJHJlYWRkaXIgPSBmcy5yZWFkZGlyXG4gIGZzLnJlYWRkaXIgPSByZWFkZGlyXG4gIHZhciBub1JlYWRkaXJPcHRpb25WZXJzaW9ucyA9IC9edlswLTVdXFwuL1xuICBmdW5jdGlvbiByZWFkZGlyIChwYXRoLCBvcHRpb25zLCBjYikge1xuICAgIGlmICh0eXBlb2Ygb3B0aW9ucyA9PT0gJ2Z1bmN0aW9uJylcbiAgICAgIGNiID0gb3B0aW9ucywgb3B0aW9ucyA9IG51bGxcblxuICAgIHZhciBnbyRyZWFkZGlyID0gbm9SZWFkZGlyT3B0aW9uVmVyc2lvbnMudGVzdChwcm9jZXNzLnZlcnNpb24pXG4gICAgICA/IGZ1bmN0aW9uIGdvJHJlYWRkaXIgKHBhdGgsIG9wdGlvbnMsIGNiLCBzdGFydFRpbWUpIHtcbiAgICAgICAgcmV0dXJuIGZzJHJlYWRkaXIocGF0aCwgZnMkcmVhZGRpckNhbGxiYWNrKFxuICAgICAgICAgIHBhdGgsIG9wdGlvbnMsIGNiLCBzdGFydFRpbWVcbiAgICAgICAgKSlcbiAgICAgIH1cbiAgICAgIDogZnVuY3Rpb24gZ28kcmVhZGRpciAocGF0aCwgb3B0aW9ucywgY2IsIHN0YXJ0VGltZSkge1xuICAgICAgICByZXR1cm4gZnMkcmVhZGRpcihwYXRoLCBvcHRpb25zLCBmcyRyZWFkZGlyQ2FsbGJhY2soXG4gICAgICAgICAgcGF0aCwgb3B0aW9ucywgY2IsIHN0YXJ0VGltZVxuICAgICAgICApKVxuICAgICAgfVxuXG4gICAgcmV0dXJuIGdvJHJlYWRkaXIocGF0aCwgb3B0aW9ucywgY2IpXG5cbiAgICBmdW5jdGlvbiBmcyRyZWFkZGlyQ2FsbGJhY2sgKHBhdGgsIG9wdGlvbnMsIGNiLCBzdGFydFRpbWUpIHtcbiAgICAgIHJldHVybiBmdW5jdGlvbiAoZXJyLCBmaWxlcykge1xuICAgICAgICBpZiAoZXJyICYmIChlcnIuY29kZSA9PT0gJ0VNRklMRScgfHwgZXJyLmNvZGUgPT09ICdFTkZJTEUnKSlcbiAgICAgICAgICBlbnF1ZXVlKFtcbiAgICAgICAgICAgIGdvJHJlYWRkaXIsXG4gICAgICAgICAgICBbcGF0aCwgb3B0aW9ucywgY2JdLFxuICAgICAgICAgICAgZXJyLFxuICAgICAgICAgICAgc3RhcnRUaW1lIHx8IERhdGUubm93KCksXG4gICAgICAgICAgICBEYXRlLm5vdygpXG4gICAgICAgICAgXSlcbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgaWYgKGZpbGVzICYmIGZpbGVzLnNvcnQpXG4gICAgICAgICAgICBmaWxlcy5zb3J0KClcblxuICAgICAgICAgIGlmICh0eXBlb2YgY2IgPT09ICdmdW5jdGlvbicpXG4gICAgICAgICAgICBjYi5jYWxsKHRoaXMsIGVyciwgZmlsZXMpXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBpZiAocHJvY2Vzcy52ZXJzaW9uLnN1YnN0cigwLCA0KSA9PT0gJ3YwLjgnKSB7XG4gICAgdmFyIGxlZ1N0cmVhbXMgPSBsZWdhY3koZnMpXG4gICAgUmVhZFN0cmVhbSA9IGxlZ1N0cmVhbXMuUmVhZFN0cmVhbVxuICAgIFdyaXRlU3RyZWFtID0gbGVnU3RyZWFtcy5Xcml0ZVN0cmVhbVxuICB9XG5cbiAgdmFyIGZzJFJlYWRTdHJlYW0gPSBmcy5SZWFkU3RyZWFtXG4gIGlmIChmcyRSZWFkU3RyZWFtKSB7XG4gICAgUmVhZFN0cmVhbS5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKGZzJFJlYWRTdHJlYW0ucHJvdG90eXBlKVxuICAgIFJlYWRTdHJlYW0ucHJvdG90eXBlLm9wZW4gPSBSZWFkU3RyZWFtJG9wZW5cbiAgfVxuXG4gIHZhciBmcyRXcml0ZVN0cmVhbSA9IGZzLldyaXRlU3RyZWFtXG4gIGlmIChmcyRXcml0ZVN0cmVhbSkge1xuICAgIFdyaXRlU3RyZWFtLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoZnMkV3JpdGVTdHJlYW0ucHJvdG90eXBlKVxuICAgIFdyaXRlU3RyZWFtLnByb3RvdHlwZS5vcGVuID0gV3JpdGVTdHJlYW0kb3BlblxuICB9XG5cbiAgT2JqZWN0LmRlZmluZVByb3BlcnR5KGZzLCAnUmVhZFN0cmVhbScsIHtcbiAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgIHJldHVybiBSZWFkU3RyZWFtXG4gICAgfSxcbiAgICBzZXQ6IGZ1bmN0aW9uICh2YWwpIHtcbiAgICAgIFJlYWRTdHJlYW0gPSB2YWxcbiAgICB9LFxuICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgY29uZmlndXJhYmxlOiB0cnVlXG4gIH0pXG4gIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShmcywgJ1dyaXRlU3RyZWFtJywge1xuICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgcmV0dXJuIFdyaXRlU3RyZWFtXG4gICAgfSxcbiAgICBzZXQ6IGZ1bmN0aW9uICh2YWwpIHtcbiAgICAgIFdyaXRlU3RyZWFtID0gdmFsXG4gICAgfSxcbiAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICB9KVxuXG4gIC8vIGxlZ2FjeSBuYW1lc1xuICB2YXIgRmlsZVJlYWRTdHJlYW0gPSBSZWFkU3RyZWFtXG4gIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShmcywgJ0ZpbGVSZWFkU3RyZWFtJywge1xuICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgcmV0dXJuIEZpbGVSZWFkU3RyZWFtXG4gICAgfSxcbiAgICBzZXQ6IGZ1bmN0aW9uICh2YWwpIHtcbiAgICAgIEZpbGVSZWFkU3RyZWFtID0gdmFsXG4gICAgfSxcbiAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICB9KVxuICB2YXIgRmlsZVdyaXRlU3RyZWFtID0gV3JpdGVTdHJlYW1cbiAgT2JqZWN0LmRlZmluZVByb3BlcnR5KGZzLCAnRmlsZVdyaXRlU3RyZWFtJywge1xuICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgcmV0dXJuIEZpbGVXcml0ZVN0cmVhbVxuICAgIH0sXG4gICAgc2V0OiBmdW5jdGlvbiAodmFsKSB7XG4gICAgICBGaWxlV3JpdGVTdHJlYW0gPSB2YWxcbiAgICB9LFxuICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgY29uZmlndXJhYmxlOiB0cnVlXG4gIH0pXG5cbiAgZnVuY3Rpb24gUmVhZFN0cmVhbSAocGF0aCwgb3B0aW9ucykge1xuICAgIGlmICh0aGlzIGluc3RhbmNlb2YgUmVhZFN0cmVhbSlcbiAgICAgIHJldHVybiBmcyRSZWFkU3RyZWFtLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyksIHRoaXNcbiAgICBlbHNlXG4gICAgICByZXR1cm4gUmVhZFN0cmVhbS5hcHBseShPYmplY3QuY3JlYXRlKFJlYWRTdHJlYW0ucHJvdG90eXBlKSwgYXJndW1lbnRzKVxuICB9XG5cbiAgZnVuY3Rpb24gUmVhZFN0cmVhbSRvcGVuICgpIHtcbiAgICB2YXIgdGhhdCA9IHRoaXNcbiAgICBvcGVuKHRoYXQucGF0aCwgdGhhdC5mbGFncywgdGhhdC5tb2RlLCBmdW5jdGlvbiAoZXJyLCBmZCkge1xuICAgICAgaWYgKGVycikge1xuICAgICAgICBpZiAodGhhdC5hdXRvQ2xvc2UpXG4gICAgICAgICAgdGhhdC5kZXN0cm95KClcblxuICAgICAgICB0aGF0LmVtaXQoJ2Vycm9yJywgZXJyKVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhhdC5mZCA9IGZkXG4gICAgICAgIHRoYXQuZW1pdCgnb3BlbicsIGZkKVxuICAgICAgICB0aGF0LnJlYWQoKVxuICAgICAgfVxuICAgIH0pXG4gIH1cblxuICBmdW5jdGlvbiBXcml0ZVN0cmVhbSAocGF0aCwgb3B0aW9ucykge1xuICAgIGlmICh0aGlzIGluc3RhbmNlb2YgV3JpdGVTdHJlYW0pXG4gICAgICByZXR1cm4gZnMkV3JpdGVTdHJlYW0uYXBwbHkodGhpcywgYXJndW1lbnRzKSwgdGhpc1xuICAgIGVsc2VcbiAgICAgIHJldHVybiBXcml0ZVN0cmVhbS5hcHBseShPYmplY3QuY3JlYXRlKFdyaXRlU3RyZWFtLnByb3RvdHlwZSksIGFyZ3VtZW50cylcbiAgfVxuXG4gIGZ1bmN0aW9uIFdyaXRlU3RyZWFtJG9wZW4gKCkge1xuICAgIHZhciB0aGF0ID0gdGhpc1xuICAgIG9wZW4odGhhdC5wYXRoLCB0aGF0LmZsYWdzLCB0aGF0Lm1vZGUsIGZ1bmN0aW9uIChlcnIsIGZkKSB7XG4gICAgICBpZiAoZXJyKSB7XG4gICAgICAgIHRoYXQuZGVzdHJveSgpXG4gICAgICAgIHRoYXQuZW1pdCgnZXJyb3InLCBlcnIpXG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGF0LmZkID0gZmRcbiAgICAgICAgdGhhdC5lbWl0KCdvcGVuJywgZmQpXG4gICAgICB9XG4gICAgfSlcbiAgfVxuXG4gIGZ1bmN0aW9uIGNyZWF0ZVJlYWRTdHJlYW0gKHBhdGgsIG9wdGlvbnMpIHtcbiAgICByZXR1cm4gbmV3IGZzLlJlYWRTdHJlYW0ocGF0aCwgb3B0aW9ucylcbiAgfVxuXG4gIGZ1bmN0aW9uIGNyZWF0ZVdyaXRlU3RyZWFtIChwYXRoLCBvcHRpb25zKSB7XG4gICAgcmV0dXJuIG5ldyBmcy5Xcml0ZVN0cmVhbShwYXRoLCBvcHRpb25zKVxuICB9XG5cbiAgdmFyIGZzJG9wZW4gPSBmcy5vcGVuXG4gIGZzLm9wZW4gPSBvcGVuXG4gIGZ1bmN0aW9uIG9wZW4gKHBhdGgsIGZsYWdzLCBtb2RlLCBjYikge1xuICAgIGlmICh0eXBlb2YgbW9kZSA9PT0gJ2Z1bmN0aW9uJylcbiAgICAgIGNiID0gbW9kZSwgbW9kZSA9IG51bGxcblxuICAgIHJldHVybiBnbyRvcGVuKHBhdGgsIGZsYWdzLCBtb2RlLCBjYilcblxuICAgIGZ1bmN0aW9uIGdvJG9wZW4gKHBhdGgsIGZsYWdzLCBtb2RlLCBjYiwgc3RhcnRUaW1lKSB7XG4gICAgICByZXR1cm4gZnMkb3BlbihwYXRoLCBmbGFncywgbW9kZSwgZnVuY3Rpb24gKGVyciwgZmQpIHtcbiAgICAgICAgaWYgKGVyciAmJiAoZXJyLmNvZGUgPT09ICdFTUZJTEUnIHx8IGVyci5jb2RlID09PSAnRU5GSUxFJykpXG4gICAgICAgICAgZW5xdWV1ZShbZ28kb3BlbiwgW3BhdGgsIGZsYWdzLCBtb2RlLCBjYl0sIGVyciwgc3RhcnRUaW1lIHx8IERhdGUubm93KCksIERhdGUubm93KCldKVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICBpZiAodHlwZW9mIGNiID09PSAnZnVuY3Rpb24nKVxuICAgICAgICAgICAgY2IuYXBwbHkodGhpcywgYXJndW1lbnRzKVxuICAgICAgICB9XG4gICAgICB9KVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiBmc1xufVxuXG5mdW5jdGlvbiBlbnF1ZXVlIChlbGVtKSB7XG4gIGRlYnVnKCdFTlFVRVVFJywgZWxlbVswXS5uYW1lLCBlbGVtWzFdKVxuICBmc1tncmFjZWZ1bFF1ZXVlXS5wdXNoKGVsZW0pXG4gIHJldHJ5KClcbn1cblxuLy8ga2VlcCB0cmFjayBvZiB0aGUgdGltZW91dCBiZXR3ZWVuIHJldHJ5KCkgY2FsbHNcbnZhciByZXRyeVRpbWVyXG5cbi8vIHJlc2V0IHRoZSBzdGFydFRpbWUgYW5kIGxhc3RUaW1lIHRvIG5vd1xuLy8gdGhpcyByZXNldHMgdGhlIHN0YXJ0IG9mIHRoZSA2MCBzZWNvbmQgb3ZlcmFsbCB0aW1lb3V0IGFzIHdlbGwgYXMgdGhlXG4vLyBkZWxheSBiZXR3ZWVuIGF0dGVtcHRzIHNvIHRoYXQgd2UnbGwgcmV0cnkgdGhlc2Ugam9icyBzb29uZXJcbmZ1bmN0aW9uIHJlc2V0UXVldWUgKCkge1xuICB2YXIgbm93ID0gRGF0ZS5ub3coKVxuICBmb3IgKHZhciBpID0gMDsgaSA8IGZzW2dyYWNlZnVsUXVldWVdLmxlbmd0aDsgKytpKSB7XG4gICAgLy8gZW50cmllcyB0aGF0IGFyZSBvbmx5IGEgbGVuZ3RoIG9mIDIgYXJlIGZyb20gYW4gb2xkZXIgdmVyc2lvbiwgZG9uJ3RcbiAgICAvLyBib3RoZXIgbW9kaWZ5aW5nIHRob3NlIHNpbmNlIHRoZXknbGwgYmUgcmV0cmllZCBhbnl3YXkuXG4gICAgaWYgKGZzW2dyYWNlZnVsUXVldWVdW2ldLmxlbmd0aCA+IDIpIHtcbiAgICAgIGZzW2dyYWNlZnVsUXVldWVdW2ldWzNdID0gbm93IC8vIHN0YXJ0VGltZVxuICAgICAgZnNbZ3JhY2VmdWxRdWV1ZV1baV1bNF0gPSBub3cgLy8gbGFzdFRpbWVcbiAgICB9XG4gIH1cbiAgLy8gY2FsbCByZXRyeSB0byBtYWtlIHN1cmUgd2UncmUgYWN0aXZlbHkgcHJvY2Vzc2luZyB0aGUgcXVldWVcbiAgcmV0cnkoKVxufVxuXG5mdW5jdGlvbiByZXRyeSAoKSB7XG4gIC8vIGNsZWFyIHRoZSB0aW1lciBhbmQgcmVtb3ZlIGl0IHRvIGhlbHAgcHJldmVudCB1bmludGVuZGVkIGNvbmN1cnJlbmN5XG4gIGNsZWFyVGltZW91dChyZXRyeVRpbWVyKVxuICByZXRyeVRpbWVyID0gdW5kZWZpbmVkXG5cbiAgaWYgKGZzW2dyYWNlZnVsUXVldWVdLmxlbmd0aCA9PT0gMClcbiAgICByZXR1cm5cblxuICB2YXIgZWxlbSA9IGZzW2dyYWNlZnVsUXVldWVdLnNoaWZ0KClcbiAgdmFyIGZuID0gZWxlbVswXVxuICB2YXIgYXJncyA9IGVsZW1bMV1cbiAgLy8gdGhlc2UgaXRlbXMgbWF5IGJlIHVuc2V0IGlmIHRoZXkgd2VyZSBhZGRlZCBieSBhbiBvbGRlciBncmFjZWZ1bC1mc1xuICB2YXIgZXJyID0gZWxlbVsyXVxuICB2YXIgc3RhcnRUaW1lID0gZWxlbVszXVxuICB2YXIgbGFzdFRpbWUgPSBlbGVtWzRdXG5cbiAgLy8gaWYgd2UgZG9uJ3QgaGF2ZSBhIHN0YXJ0VGltZSB3ZSBoYXZlIG5vIHdheSBvZiBrbm93aW5nIGlmIHdlJ3ZlIHdhaXRlZFxuICAvLyBsb25nIGVub3VnaCwgc28gZ28gYWhlYWQgYW5kIHJldHJ5IHRoaXMgaXRlbSBub3dcbiAgaWYgKHN0YXJ0VGltZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgZGVidWcoJ1JFVFJZJywgZm4ubmFtZSwgYXJncylcbiAgICBmbi5hcHBseShudWxsLCBhcmdzKVxuICB9IGVsc2UgaWYgKERhdGUubm93KCkgLSBzdGFydFRpbWUgPj0gNjAwMDApIHtcbiAgICAvLyBpdCdzIGJlZW4gbW9yZSB0aGFuIDYwIHNlY29uZHMgdG90YWwsIGJhaWwgbm93XG4gICAgZGVidWcoJ1RJTUVPVVQnLCBmbi5uYW1lLCBhcmdzKVxuICAgIHZhciBjYiA9IGFyZ3MucG9wKClcbiAgICBpZiAodHlwZW9mIGNiID09PSAnZnVuY3Rpb24nKVxuICAgICAgY2IuY2FsbChudWxsLCBlcnIpXG4gIH0gZWxzZSB7XG4gICAgLy8gdGhlIGFtb3VudCBvZiB0aW1lIGJldHdlZW4gdGhlIGxhc3QgYXR0ZW1wdCBhbmQgcmlnaHQgbm93XG4gICAgdmFyIHNpbmNlQXR0ZW1wdCA9IERhdGUubm93KCkgLSBsYXN0VGltZVxuICAgIC8vIHRoZSBhbW91bnQgb2YgdGltZSBiZXR3ZWVuIHdoZW4gd2UgZmlyc3QgdHJpZWQsIGFuZCB3aGVuIHdlIGxhc3QgdHJpZWRcbiAgICAvLyByb3VuZGVkIHVwIHRvIGF0IGxlYXN0IDFcbiAgICB2YXIgc2luY2VTdGFydCA9IE1hdGgubWF4KGxhc3RUaW1lIC0gc3RhcnRUaW1lLCAxKVxuICAgIC8vIGJhY2tvZmYuIHdhaXQgbG9uZ2VyIHRoYW4gdGhlIHRvdGFsIHRpbWUgd2UndmUgYmVlbiByZXRyeWluZywgYnV0IG9ubHlcbiAgICAvLyB1cCB0byBhIG1heGltdW0gb2YgMTAwbXNcbiAgICB2YXIgZGVzaXJlZERlbGF5ID0gTWF0aC5taW4oc2luY2VTdGFydCAqIDEuMiwgMTAwKVxuICAgIC8vIGl0J3MgYmVlbiBsb25nIGVub3VnaCBzaW5jZSB0aGUgbGFzdCByZXRyeSwgZG8gaXQgYWdhaW5cbiAgICBpZiAoc2luY2VBdHRlbXB0ID49IGRlc2lyZWREZWxheSkge1xuICAgICAgZGVidWcoJ1JFVFJZJywgZm4ubmFtZSwgYXJncylcbiAgICAgIGZuLmFwcGx5KG51bGwsIGFyZ3MuY29uY2F0KFtzdGFydFRpbWVdKSlcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gaWYgd2UgY2FuJ3QgZG8gdGhpcyBqb2IgeWV0LCBwdXNoIGl0IHRvIHRoZSBlbmQgb2YgdGhlIHF1ZXVlXG4gICAgICAvLyBhbmQgbGV0IHRoZSBuZXh0IGl0ZXJhdGlvbiBjaGVjayBhZ2FpblxuICAgICAgZnNbZ3JhY2VmdWxRdWV1ZV0ucHVzaChlbGVtKVxuICAgIH1cbiAgfVxuXG4gIC8vIHNjaGVkdWxlIG91ciBuZXh0IHJ1biBpZiBvbmUgaXNuJ3QgYWxyZWFkeSBzY2hlZHVsZWRcbiAgaWYgKHJldHJ5VGltZXIgPT09IHVuZGVmaW5lZCkge1xuICAgIHJldHJ5VGltZXIgPSBzZXRUaW1lb3V0KHJldHJ5LCAwKVxuICB9XG59XG4iLCJ2YXIgU3RyZWFtID0gcmVxdWlyZSgnc3RyZWFtJykuU3RyZWFtXG5cbm1vZHVsZS5leHBvcnRzID0gbGVnYWN5XG5cbmZ1bmN0aW9uIGxlZ2FjeSAoZnMpIHtcbiAgcmV0dXJuIHtcbiAgICBSZWFkU3RyZWFtOiBSZWFkU3RyZWFtLFxuICAgIFdyaXRlU3RyZWFtOiBXcml0ZVN0cmVhbVxuICB9XG5cbiAgZnVuY3Rpb24gUmVhZFN0cmVhbSAocGF0aCwgb3B0aW9ucykge1xuICAgIGlmICghKHRoaXMgaW5zdGFuY2VvZiBSZWFkU3RyZWFtKSkgcmV0dXJuIG5ldyBSZWFkU3RyZWFtKHBhdGgsIG9wdGlvbnMpO1xuXG4gICAgU3RyZWFtLmNhbGwodGhpcyk7XG5cbiAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICB0aGlzLnBhdGggPSBwYXRoO1xuICAgIHRoaXMuZmQgPSBudWxsO1xuICAgIHRoaXMucmVhZGFibGUgPSB0cnVlO1xuICAgIHRoaXMucGF1c2VkID0gZmFsc2U7XG5cbiAgICB0aGlzLmZsYWdzID0gJ3InO1xuICAgIHRoaXMubW9kZSA9IDQzODsgLyo9MDY2NiovXG4gICAgdGhpcy5idWZmZXJTaXplID0gNjQgKiAxMDI0O1xuXG4gICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG5cbiAgICAvLyBNaXhpbiBvcHRpb25zIGludG8gdGhpc1xuICAgIHZhciBrZXlzID0gT2JqZWN0LmtleXMob3B0aW9ucyk7XG4gICAgZm9yICh2YXIgaW5kZXggPSAwLCBsZW5ndGggPSBrZXlzLmxlbmd0aDsgaW5kZXggPCBsZW5ndGg7IGluZGV4KyspIHtcbiAgICAgIHZhciBrZXkgPSBrZXlzW2luZGV4XTtcbiAgICAgIHRoaXNba2V5XSA9IG9wdGlvbnNba2V5XTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5lbmNvZGluZykgdGhpcy5zZXRFbmNvZGluZyh0aGlzLmVuY29kaW5nKTtcblxuICAgIGlmICh0aGlzLnN0YXJ0ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGlmICgnbnVtYmVyJyAhPT0gdHlwZW9mIHRoaXMuc3RhcnQpIHtcbiAgICAgICAgdGhyb3cgVHlwZUVycm9yKCdzdGFydCBtdXN0IGJlIGEgTnVtYmVyJyk7XG4gICAgICB9XG4gICAgICBpZiAodGhpcy5lbmQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICB0aGlzLmVuZCA9IEluZmluaXR5O1xuICAgICAgfSBlbHNlIGlmICgnbnVtYmVyJyAhPT0gdHlwZW9mIHRoaXMuZW5kKSB7XG4gICAgICAgIHRocm93IFR5cGVFcnJvcignZW5kIG11c3QgYmUgYSBOdW1iZXInKTtcbiAgICAgIH1cblxuICAgICAgaWYgKHRoaXMuc3RhcnQgPiB0aGlzLmVuZCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ3N0YXJ0IG11c3QgYmUgPD0gZW5kJyk7XG4gICAgICB9XG5cbiAgICAgIHRoaXMucG9zID0gdGhpcy5zdGFydDtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5mZCAhPT0gbnVsbCkge1xuICAgICAgcHJvY2Vzcy5uZXh0VGljayhmdW5jdGlvbigpIHtcbiAgICAgICAgc2VsZi5fcmVhZCgpO1xuICAgICAgfSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgZnMub3Blbih0aGlzLnBhdGgsIHRoaXMuZmxhZ3MsIHRoaXMubW9kZSwgZnVuY3Rpb24gKGVyciwgZmQpIHtcbiAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgc2VsZi5lbWl0KCdlcnJvcicsIGVycik7XG4gICAgICAgIHNlbGYucmVhZGFibGUgPSBmYWxzZTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBzZWxmLmZkID0gZmQ7XG4gICAgICBzZWxmLmVtaXQoJ29wZW4nLCBmZCk7XG4gICAgICBzZWxmLl9yZWFkKCk7XG4gICAgfSlcbiAgfVxuXG4gIGZ1bmN0aW9uIFdyaXRlU3RyZWFtIChwYXRoLCBvcHRpb25zKSB7XG4gICAgaWYgKCEodGhpcyBpbnN0YW5jZW9mIFdyaXRlU3RyZWFtKSkgcmV0dXJuIG5ldyBXcml0ZVN0cmVhbShwYXRoLCBvcHRpb25zKTtcblxuICAgIFN0cmVhbS5jYWxsKHRoaXMpO1xuXG4gICAgdGhpcy5wYXRoID0gcGF0aDtcbiAgICB0aGlzLmZkID0gbnVsbDtcbiAgICB0aGlzLndyaXRhYmxlID0gdHJ1ZTtcblxuICAgIHRoaXMuZmxhZ3MgPSAndyc7XG4gICAgdGhpcy5lbmNvZGluZyA9ICdiaW5hcnknO1xuICAgIHRoaXMubW9kZSA9IDQzODsgLyo9MDY2NiovXG4gICAgdGhpcy5ieXRlc1dyaXR0ZW4gPSAwO1xuXG4gICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG5cbiAgICAvLyBNaXhpbiBvcHRpb25zIGludG8gdGhpc1xuICAgIHZhciBrZXlzID0gT2JqZWN0LmtleXMob3B0aW9ucyk7XG4gICAgZm9yICh2YXIgaW5kZXggPSAwLCBsZW5ndGggPSBrZXlzLmxlbmd0aDsgaW5kZXggPCBsZW5ndGg7IGluZGV4KyspIHtcbiAgICAgIHZhciBrZXkgPSBrZXlzW2luZGV4XTtcbiAgICAgIHRoaXNba2V5XSA9IG9wdGlvbnNba2V5XTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5zdGFydCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBpZiAoJ251bWJlcicgIT09IHR5cGVvZiB0aGlzLnN0YXJ0KSB7XG4gICAgICAgIHRocm93IFR5cGVFcnJvcignc3RhcnQgbXVzdCBiZSBhIE51bWJlcicpO1xuICAgICAgfVxuICAgICAgaWYgKHRoaXMuc3RhcnQgPCAwKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignc3RhcnQgbXVzdCBiZSA+PSB6ZXJvJyk7XG4gICAgICB9XG5cbiAgICAgIHRoaXMucG9zID0gdGhpcy5zdGFydDtcbiAgICB9XG5cbiAgICB0aGlzLmJ1c3kgPSBmYWxzZTtcbiAgICB0aGlzLl9xdWV1ZSA9IFtdO1xuXG4gICAgaWYgKHRoaXMuZmQgPT09IG51bGwpIHtcbiAgICAgIHRoaXMuX29wZW4gPSBmcy5vcGVuO1xuICAgICAgdGhpcy5fcXVldWUucHVzaChbdGhpcy5fb3BlbiwgdGhpcy5wYXRoLCB0aGlzLmZsYWdzLCB0aGlzLm1vZGUsIHVuZGVmaW5lZF0pO1xuICAgICAgdGhpcy5mbHVzaCgpO1xuICAgIH1cbiAgfVxufVxuIiwidmFyIGNvbnN0YW50cyA9IHJlcXVpcmUoJ2NvbnN0YW50cycpXG5cbnZhciBvcmlnQ3dkID0gcHJvY2Vzcy5jd2RcbnZhciBjd2QgPSBudWxsXG5cbnZhciBwbGF0Zm9ybSA9IHByb2Nlc3MuZW52LkdSQUNFRlVMX0ZTX1BMQVRGT1JNIHx8IHByb2Nlc3MucGxhdGZvcm1cblxucHJvY2Vzcy5jd2QgPSBmdW5jdGlvbigpIHtcbiAgaWYgKCFjd2QpXG4gICAgY3dkID0gb3JpZ0N3ZC5jYWxsKHByb2Nlc3MpXG4gIHJldHVybiBjd2Rcbn1cbnRyeSB7XG4gIHByb2Nlc3MuY3dkKClcbn0gY2F0Y2ggKGVyKSB7fVxuXG4vLyBUaGlzIGNoZWNrIGlzIG5lZWRlZCB1bnRpbCBub2RlLmpzIDEyIGlzIHJlcXVpcmVkXG5pZiAodHlwZW9mIHByb2Nlc3MuY2hkaXIgPT09ICdmdW5jdGlvbicpIHtcbiAgdmFyIGNoZGlyID0gcHJvY2Vzcy5jaGRpclxuICBwcm9jZXNzLmNoZGlyID0gZnVuY3Rpb24gKGQpIHtcbiAgICBjd2QgPSBudWxsXG4gICAgY2hkaXIuY2FsbChwcm9jZXNzLCBkKVxuICB9XG4gIGlmIChPYmplY3Quc2V0UHJvdG90eXBlT2YpIE9iamVjdC5zZXRQcm90b3R5cGVPZihwcm9jZXNzLmNoZGlyLCBjaGRpcilcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBwYXRjaFxuXG5mdW5jdGlvbiBwYXRjaCAoZnMpIHtcbiAgLy8gKHJlLSlpbXBsZW1lbnQgc29tZSB0aGluZ3MgdGhhdCBhcmUga25vd24gYnVzdGVkIG9yIG1pc3NpbmcuXG5cbiAgLy8gbGNobW9kLCBicm9rZW4gcHJpb3IgdG8gMC42LjJcbiAgLy8gYmFjay1wb3J0IHRoZSBmaXggaGVyZS5cbiAgaWYgKGNvbnN0YW50cy5oYXNPd25Qcm9wZXJ0eSgnT19TWU1MSU5LJykgJiZcbiAgICAgIHByb2Nlc3MudmVyc2lvbi5tYXRjaCgvXnYwXFwuNlxcLlswLTJdfF52MFxcLjVcXC4vKSkge1xuICAgIHBhdGNoTGNobW9kKGZzKVxuICB9XG5cbiAgLy8gbHV0aW1lcyBpbXBsZW1lbnRhdGlvbiwgb3Igbm8tb3BcbiAgaWYgKCFmcy5sdXRpbWVzKSB7XG4gICAgcGF0Y2hMdXRpbWVzKGZzKVxuICB9XG5cbiAgLy8gaHR0cHM6Ly9naXRodWIuY29tL2lzYWFjcy9ub2RlLWdyYWNlZnVsLWZzL2lzc3Vlcy80XG4gIC8vIENob3duIHNob3VsZCBub3QgZmFpbCBvbiBlaW52YWwgb3IgZXBlcm0gaWYgbm9uLXJvb3QuXG4gIC8vIEl0IHNob3VsZCBub3QgZmFpbCBvbiBlbm9zeXMgZXZlciwgYXMgdGhpcyBqdXN0IGluZGljYXRlc1xuICAvLyB0aGF0IGEgZnMgZG9lc24ndCBzdXBwb3J0IHRoZSBpbnRlbmRlZCBvcGVyYXRpb24uXG5cbiAgZnMuY2hvd24gPSBjaG93bkZpeChmcy5jaG93bilcbiAgZnMuZmNob3duID0gY2hvd25GaXgoZnMuZmNob3duKVxuICBmcy5sY2hvd24gPSBjaG93bkZpeChmcy5sY2hvd24pXG5cbiAgZnMuY2htb2QgPSBjaG1vZEZpeChmcy5jaG1vZClcbiAgZnMuZmNobW9kID0gY2htb2RGaXgoZnMuZmNobW9kKVxuICBmcy5sY2htb2QgPSBjaG1vZEZpeChmcy5sY2htb2QpXG5cbiAgZnMuY2hvd25TeW5jID0gY2hvd25GaXhTeW5jKGZzLmNob3duU3luYylcbiAgZnMuZmNob3duU3luYyA9IGNob3duRml4U3luYyhmcy5mY2hvd25TeW5jKVxuICBmcy5sY2hvd25TeW5jID0gY2hvd25GaXhTeW5jKGZzLmxjaG93blN5bmMpXG5cbiAgZnMuY2htb2RTeW5jID0gY2htb2RGaXhTeW5jKGZzLmNobW9kU3luYylcbiAgZnMuZmNobW9kU3luYyA9IGNobW9kRml4U3luYyhmcy5mY2htb2RTeW5jKVxuICBmcy5sY2htb2RTeW5jID0gY2htb2RGaXhTeW5jKGZzLmxjaG1vZFN5bmMpXG5cbiAgZnMuc3RhdCA9IHN0YXRGaXgoZnMuc3RhdClcbiAgZnMuZnN0YXQgPSBzdGF0Rml4KGZzLmZzdGF0KVxuICBmcy5sc3RhdCA9IHN0YXRGaXgoZnMubHN0YXQpXG5cbiAgZnMuc3RhdFN5bmMgPSBzdGF0Rml4U3luYyhmcy5zdGF0U3luYylcbiAgZnMuZnN0YXRTeW5jID0gc3RhdEZpeFN5bmMoZnMuZnN0YXRTeW5jKVxuICBmcy5sc3RhdFN5bmMgPSBzdGF0Rml4U3luYyhmcy5sc3RhdFN5bmMpXG5cbiAgLy8gaWYgbGNobW9kL2xjaG93biBkbyBub3QgZXhpc3QsIHRoZW4gbWFrZSB0aGVtIG5vLW9wc1xuICBpZiAoZnMuY2htb2QgJiYgIWZzLmxjaG1vZCkge1xuICAgIGZzLmxjaG1vZCA9IGZ1bmN0aW9uIChwYXRoLCBtb2RlLCBjYikge1xuICAgICAgaWYgKGNiKSBwcm9jZXNzLm5leHRUaWNrKGNiKVxuICAgIH1cbiAgICBmcy5sY2htb2RTeW5jID0gZnVuY3Rpb24gKCkge31cbiAgfVxuICBpZiAoZnMuY2hvd24gJiYgIWZzLmxjaG93bikge1xuICAgIGZzLmxjaG93biA9IGZ1bmN0aW9uIChwYXRoLCB1aWQsIGdpZCwgY2IpIHtcbiAgICAgIGlmIChjYikgcHJvY2Vzcy5uZXh0VGljayhjYilcbiAgICB9XG4gICAgZnMubGNob3duU3luYyA9IGZ1bmN0aW9uICgpIHt9XG4gIH1cblxuICAvLyBvbiBXaW5kb3dzLCBBL1Ygc29mdHdhcmUgY2FuIGxvY2sgdGhlIGRpcmVjdG9yeSwgY2F1c2luZyB0aGlzXG4gIC8vIHRvIGZhaWwgd2l0aCBhbiBFQUNDRVMgb3IgRVBFUk0gaWYgdGhlIGRpcmVjdG9yeSBjb250YWlucyBuZXdseVxuICAvLyBjcmVhdGVkIGZpbGVzLiAgVHJ5IGFnYWluIG9uIGZhaWx1cmUsIGZvciB1cCB0byA2MCBzZWNvbmRzLlxuXG4gIC8vIFNldCB0aGUgdGltZW91dCB0aGlzIGxvbmcgYmVjYXVzZSBzb21lIFdpbmRvd3MgQW50aS1WaXJ1cywgc3VjaCBhcyBQYXJpdHlcbiAgLy8gYml0OSwgbWF5IGxvY2sgZmlsZXMgZm9yIHVwIHRvIGEgbWludXRlLCBjYXVzaW5nIG5wbSBwYWNrYWdlIGluc3RhbGxcbiAgLy8gZmFpbHVyZXMuIEFsc28sIHRha2UgY2FyZSB0byB5aWVsZCB0aGUgc2NoZWR1bGVyLiBXaW5kb3dzIHNjaGVkdWxpbmcgZ2l2ZXNcbiAgLy8gQ1BVIHRvIGEgYnVzeSBsb29waW5nIHByb2Nlc3MsIHdoaWNoIGNhbiBjYXVzZSB0aGUgcHJvZ3JhbSBjYXVzaW5nIHRoZSBsb2NrXG4gIC8vIGNvbnRlbnRpb24gdG8gYmUgc3RhcnZlZCBvZiBDUFUgYnkgbm9kZSwgc28gdGhlIGNvbnRlbnRpb24gZG9lc24ndCByZXNvbHZlLlxuICBpZiAocGxhdGZvcm0gPT09IFwid2luMzJcIikge1xuICAgIGZzLnJlbmFtZSA9IHR5cGVvZiBmcy5yZW5hbWUgIT09ICdmdW5jdGlvbicgPyBmcy5yZW5hbWVcbiAgICA6IChmdW5jdGlvbiAoZnMkcmVuYW1lKSB7XG4gICAgICBmdW5jdGlvbiByZW5hbWUgKGZyb20sIHRvLCBjYikge1xuICAgICAgICB2YXIgc3RhcnQgPSBEYXRlLm5vdygpXG4gICAgICAgIHZhciBiYWNrb2ZmID0gMDtcbiAgICAgICAgZnMkcmVuYW1lKGZyb20sIHRvLCBmdW5jdGlvbiBDQiAoZXIpIHtcbiAgICAgICAgICBpZiAoZXJcbiAgICAgICAgICAgICAgJiYgKGVyLmNvZGUgPT09IFwiRUFDQ0VTXCIgfHwgZXIuY29kZSA9PT0gXCJFUEVSTVwiKVxuICAgICAgICAgICAgICAmJiBEYXRlLm5vdygpIC0gc3RhcnQgPCA2MDAwMCkge1xuICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgZnMuc3RhdCh0bywgZnVuY3Rpb24gKHN0YXRlciwgc3QpIHtcbiAgICAgICAgICAgICAgICBpZiAoc3RhdGVyICYmIHN0YXRlci5jb2RlID09PSBcIkVOT0VOVFwiKVxuICAgICAgICAgICAgICAgICAgZnMkcmVuYW1lKGZyb20sIHRvLCBDQik7XG4gICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgY2IoZXIpXG4gICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICB9LCBiYWNrb2ZmKVxuICAgICAgICAgICAgaWYgKGJhY2tvZmYgPCAxMDApXG4gICAgICAgICAgICAgIGJhY2tvZmYgKz0gMTA7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChjYikgY2IoZXIpXG4gICAgICAgIH0pXG4gICAgICB9XG4gICAgICBpZiAoT2JqZWN0LnNldFByb3RvdHlwZU9mKSBPYmplY3Quc2V0UHJvdG90eXBlT2YocmVuYW1lLCBmcyRyZW5hbWUpXG4gICAgICByZXR1cm4gcmVuYW1lXG4gICAgfSkoZnMucmVuYW1lKVxuICB9XG5cbiAgLy8gaWYgcmVhZCgpIHJldHVybnMgRUFHQUlOLCB0aGVuIGp1c3QgdHJ5IGl0IGFnYWluLlxuICBmcy5yZWFkID0gdHlwZW9mIGZzLnJlYWQgIT09ICdmdW5jdGlvbicgPyBmcy5yZWFkXG4gIDogKGZ1bmN0aW9uIChmcyRyZWFkKSB7XG4gICAgZnVuY3Rpb24gcmVhZCAoZmQsIGJ1ZmZlciwgb2Zmc2V0LCBsZW5ndGgsIHBvc2l0aW9uLCBjYWxsYmFja18pIHtcbiAgICAgIHZhciBjYWxsYmFja1xuICAgICAgaWYgKGNhbGxiYWNrXyAmJiB0eXBlb2YgY2FsbGJhY2tfID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIHZhciBlYWdDb3VudGVyID0gMFxuICAgICAgICBjYWxsYmFjayA9IGZ1bmN0aW9uIChlciwgXywgX18pIHtcbiAgICAgICAgICBpZiAoZXIgJiYgZXIuY29kZSA9PT0gJ0VBR0FJTicgJiYgZWFnQ291bnRlciA8IDEwKSB7XG4gICAgICAgICAgICBlYWdDb3VudGVyICsrXG4gICAgICAgICAgICByZXR1cm4gZnMkcmVhZC5jYWxsKGZzLCBmZCwgYnVmZmVyLCBvZmZzZXQsIGxlbmd0aCwgcG9zaXRpb24sIGNhbGxiYWNrKVxuICAgICAgICAgIH1cbiAgICAgICAgICBjYWxsYmFja18uYXBwbHkodGhpcywgYXJndW1lbnRzKVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gZnMkcmVhZC5jYWxsKGZzLCBmZCwgYnVmZmVyLCBvZmZzZXQsIGxlbmd0aCwgcG9zaXRpb24sIGNhbGxiYWNrKVxuICAgIH1cblxuICAgIC8vIFRoaXMgZW5zdXJlcyBgdXRpbC5wcm9taXNpZnlgIHdvcmtzIGFzIGl0IGRvZXMgZm9yIG5hdGl2ZSBgZnMucmVhZGAuXG4gICAgaWYgKE9iamVjdC5zZXRQcm90b3R5cGVPZikgT2JqZWN0LnNldFByb3RvdHlwZU9mKHJlYWQsIGZzJHJlYWQpXG4gICAgcmV0dXJuIHJlYWRcbiAgfSkoZnMucmVhZClcblxuICBmcy5yZWFkU3luYyA9IHR5cGVvZiBmcy5yZWFkU3luYyAhPT0gJ2Z1bmN0aW9uJyA/IGZzLnJlYWRTeW5jXG4gIDogKGZ1bmN0aW9uIChmcyRyZWFkU3luYykgeyByZXR1cm4gZnVuY3Rpb24gKGZkLCBidWZmZXIsIG9mZnNldCwgbGVuZ3RoLCBwb3NpdGlvbikge1xuICAgIHZhciBlYWdDb3VudGVyID0gMFxuICAgIHdoaWxlICh0cnVlKSB7XG4gICAgICB0cnkge1xuICAgICAgICByZXR1cm4gZnMkcmVhZFN5bmMuY2FsbChmcywgZmQsIGJ1ZmZlciwgb2Zmc2V0LCBsZW5ndGgsIHBvc2l0aW9uKVxuICAgICAgfSBjYXRjaCAoZXIpIHtcbiAgICAgICAgaWYgKGVyLmNvZGUgPT09ICdFQUdBSU4nICYmIGVhZ0NvdW50ZXIgPCAxMCkge1xuICAgICAgICAgIGVhZ0NvdW50ZXIgKytcbiAgICAgICAgICBjb250aW51ZVxuICAgICAgICB9XG4gICAgICAgIHRocm93IGVyXG4gICAgICB9XG4gICAgfVxuICB9fSkoZnMucmVhZFN5bmMpXG5cbiAgZnVuY3Rpb24gcGF0Y2hMY2htb2QgKGZzKSB7XG4gICAgZnMubGNobW9kID0gZnVuY3Rpb24gKHBhdGgsIG1vZGUsIGNhbGxiYWNrKSB7XG4gICAgICBmcy5vcGVuKCBwYXRoXG4gICAgICAgICAgICAgLCBjb25zdGFudHMuT19XUk9OTFkgfCBjb25zdGFudHMuT19TWU1MSU5LXG4gICAgICAgICAgICAgLCBtb2RlXG4gICAgICAgICAgICAgLCBmdW5jdGlvbiAoZXJyLCBmZCkge1xuICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgaWYgKGNhbGxiYWNrKSBjYWxsYmFjayhlcnIpXG4gICAgICAgICAgcmV0dXJuXG4gICAgICAgIH1cbiAgICAgICAgLy8gcHJlZmVyIHRvIHJldHVybiB0aGUgY2htb2QgZXJyb3IsIGlmIG9uZSBvY2N1cnMsXG4gICAgICAgIC8vIGJ1dCBzdGlsbCB0cnkgdG8gY2xvc2UsIGFuZCByZXBvcnQgY2xvc2luZyBlcnJvcnMgaWYgdGhleSBvY2N1ci5cbiAgICAgICAgZnMuZmNobW9kKGZkLCBtb2RlLCBmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgICAgZnMuY2xvc2UoZmQsIGZ1bmN0aW9uKGVycjIpIHtcbiAgICAgICAgICAgIGlmIChjYWxsYmFjaykgY2FsbGJhY2soZXJyIHx8IGVycjIpXG4gICAgICAgICAgfSlcbiAgICAgICAgfSlcbiAgICAgIH0pXG4gICAgfVxuXG4gICAgZnMubGNobW9kU3luYyA9IGZ1bmN0aW9uIChwYXRoLCBtb2RlKSB7XG4gICAgICB2YXIgZmQgPSBmcy5vcGVuU3luYyhwYXRoLCBjb25zdGFudHMuT19XUk9OTFkgfCBjb25zdGFudHMuT19TWU1MSU5LLCBtb2RlKVxuXG4gICAgICAvLyBwcmVmZXIgdG8gcmV0dXJuIHRoZSBjaG1vZCBlcnJvciwgaWYgb25lIG9jY3VycyxcbiAgICAgIC8vIGJ1dCBzdGlsbCB0cnkgdG8gY2xvc2UsIGFuZCByZXBvcnQgY2xvc2luZyBlcnJvcnMgaWYgdGhleSBvY2N1ci5cbiAgICAgIHZhciB0aHJldyA9IHRydWVcbiAgICAgIHZhciByZXRcbiAgICAgIHRyeSB7XG4gICAgICAgIHJldCA9IGZzLmZjaG1vZFN5bmMoZmQsIG1vZGUpXG4gICAgICAgIHRocmV3ID0gZmFsc2VcbiAgICAgIH0gZmluYWxseSB7XG4gICAgICAgIGlmICh0aHJldykge1xuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICBmcy5jbG9zZVN5bmMoZmQpXG4gICAgICAgICAgfSBjYXRjaCAoZXIpIHt9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgZnMuY2xvc2VTeW5jKGZkKVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gcmV0XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gcGF0Y2hMdXRpbWVzIChmcykge1xuICAgIGlmIChjb25zdGFudHMuaGFzT3duUHJvcGVydHkoXCJPX1NZTUxJTktcIikgJiYgZnMuZnV0aW1lcykge1xuICAgICAgZnMubHV0aW1lcyA9IGZ1bmN0aW9uIChwYXRoLCBhdCwgbXQsIGNiKSB7XG4gICAgICAgIGZzLm9wZW4ocGF0aCwgY29uc3RhbnRzLk9fU1lNTElOSywgZnVuY3Rpb24gKGVyLCBmZCkge1xuICAgICAgICAgIGlmIChlcikge1xuICAgICAgICAgICAgaWYgKGNiKSBjYihlcilcbiAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgIH1cbiAgICAgICAgICBmcy5mdXRpbWVzKGZkLCBhdCwgbXQsIGZ1bmN0aW9uIChlcikge1xuICAgICAgICAgICAgZnMuY2xvc2UoZmQsIGZ1bmN0aW9uIChlcjIpIHtcbiAgICAgICAgICAgICAgaWYgKGNiKSBjYihlciB8fCBlcjIpXG4gICAgICAgICAgICB9KVxuICAgICAgICAgIH0pXG4gICAgICAgIH0pXG4gICAgICB9XG5cbiAgICAgIGZzLmx1dGltZXNTeW5jID0gZnVuY3Rpb24gKHBhdGgsIGF0LCBtdCkge1xuICAgICAgICB2YXIgZmQgPSBmcy5vcGVuU3luYyhwYXRoLCBjb25zdGFudHMuT19TWU1MSU5LKVxuICAgICAgICB2YXIgcmV0XG4gICAgICAgIHZhciB0aHJldyA9IHRydWVcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICByZXQgPSBmcy5mdXRpbWVzU3luYyhmZCwgYXQsIG10KVxuICAgICAgICAgIHRocmV3ID0gZmFsc2VcbiAgICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgICBpZiAodGhyZXcpIHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgIGZzLmNsb3NlU3luYyhmZClcbiAgICAgICAgICAgIH0gY2F0Y2ggKGVyKSB7fVxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBmcy5jbG9zZVN5bmMoZmQpXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXRcbiAgICAgIH1cblxuICAgIH0gZWxzZSBpZiAoZnMuZnV0aW1lcykge1xuICAgICAgZnMubHV0aW1lcyA9IGZ1bmN0aW9uIChfYSwgX2IsIF9jLCBjYikgeyBpZiAoY2IpIHByb2Nlc3MubmV4dFRpY2soY2IpIH1cbiAgICAgIGZzLmx1dGltZXNTeW5jID0gZnVuY3Rpb24gKCkge31cbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBjaG1vZEZpeCAob3JpZykge1xuICAgIGlmICghb3JpZykgcmV0dXJuIG9yaWdcbiAgICByZXR1cm4gZnVuY3Rpb24gKHRhcmdldCwgbW9kZSwgY2IpIHtcbiAgICAgIHJldHVybiBvcmlnLmNhbGwoZnMsIHRhcmdldCwgbW9kZSwgZnVuY3Rpb24gKGVyKSB7XG4gICAgICAgIGlmIChjaG93bkVyT2soZXIpKSBlciA9IG51bGxcbiAgICAgICAgaWYgKGNiKSBjYi5hcHBseSh0aGlzLCBhcmd1bWVudHMpXG4gICAgICB9KVxuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGNobW9kRml4U3luYyAob3JpZykge1xuICAgIGlmICghb3JpZykgcmV0dXJuIG9yaWdcbiAgICByZXR1cm4gZnVuY3Rpb24gKHRhcmdldCwgbW9kZSkge1xuICAgICAgdHJ5IHtcbiAgICAgICAgcmV0dXJuIG9yaWcuY2FsbChmcywgdGFyZ2V0LCBtb2RlKVxuICAgICAgfSBjYXRjaCAoZXIpIHtcbiAgICAgICAgaWYgKCFjaG93bkVyT2soZXIpKSB0aHJvdyBlclxuICAgICAgfVxuICAgIH1cbiAgfVxuXG5cbiAgZnVuY3Rpb24gY2hvd25GaXggKG9yaWcpIHtcbiAgICBpZiAoIW9yaWcpIHJldHVybiBvcmlnXG4gICAgcmV0dXJuIGZ1bmN0aW9uICh0YXJnZXQsIHVpZCwgZ2lkLCBjYikge1xuICAgICAgcmV0dXJuIG9yaWcuY2FsbChmcywgdGFyZ2V0LCB1aWQsIGdpZCwgZnVuY3Rpb24gKGVyKSB7XG4gICAgICAgIGlmIChjaG93bkVyT2soZXIpKSBlciA9IG51bGxcbiAgICAgICAgaWYgKGNiKSBjYi5hcHBseSh0aGlzLCBhcmd1bWVudHMpXG4gICAgICB9KVxuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGNob3duRml4U3luYyAob3JpZykge1xuICAgIGlmICghb3JpZykgcmV0dXJuIG9yaWdcbiAgICByZXR1cm4gZnVuY3Rpb24gKHRhcmdldCwgdWlkLCBnaWQpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIHJldHVybiBvcmlnLmNhbGwoZnMsIHRhcmdldCwgdWlkLCBnaWQpXG4gICAgICB9IGNhdGNoIChlcikge1xuICAgICAgICBpZiAoIWNob3duRXJPayhlcikpIHRocm93IGVyXG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gc3RhdEZpeCAob3JpZykge1xuICAgIGlmICghb3JpZykgcmV0dXJuIG9yaWdcbiAgICAvLyBPbGRlciB2ZXJzaW9ucyBvZiBOb2RlIGVycm9uZW91c2x5IHJldHVybmVkIHNpZ25lZCBpbnRlZ2VycyBmb3JcbiAgICAvLyB1aWQgKyBnaWQuXG4gICAgcmV0dXJuIGZ1bmN0aW9uICh0YXJnZXQsIG9wdGlvbnMsIGNiKSB7XG4gICAgICBpZiAodHlwZW9mIG9wdGlvbnMgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgY2IgPSBvcHRpb25zXG4gICAgICAgIG9wdGlvbnMgPSBudWxsXG4gICAgICB9XG4gICAgICBmdW5jdGlvbiBjYWxsYmFjayAoZXIsIHN0YXRzKSB7XG4gICAgICAgIGlmIChzdGF0cykge1xuICAgICAgICAgIGlmIChzdGF0cy51aWQgPCAwKSBzdGF0cy51aWQgKz0gMHgxMDAwMDAwMDBcbiAgICAgICAgICBpZiAoc3RhdHMuZ2lkIDwgMCkgc3RhdHMuZ2lkICs9IDB4MTAwMDAwMDAwXG4gICAgICAgIH1cbiAgICAgICAgaWYgKGNiKSBjYi5hcHBseSh0aGlzLCBhcmd1bWVudHMpXG4gICAgICB9XG4gICAgICByZXR1cm4gb3B0aW9ucyA/IG9yaWcuY2FsbChmcywgdGFyZ2V0LCBvcHRpb25zLCBjYWxsYmFjaylcbiAgICAgICAgOiBvcmlnLmNhbGwoZnMsIHRhcmdldCwgY2FsbGJhY2spXG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gc3RhdEZpeFN5bmMgKG9yaWcpIHtcbiAgICBpZiAoIW9yaWcpIHJldHVybiBvcmlnXG4gICAgLy8gT2xkZXIgdmVyc2lvbnMgb2YgTm9kZSBlcnJvbmVvdXNseSByZXR1cm5lZCBzaWduZWQgaW50ZWdlcnMgZm9yXG4gICAgLy8gdWlkICsgZ2lkLlxuICAgIHJldHVybiBmdW5jdGlvbiAodGFyZ2V0LCBvcHRpb25zKSB7XG4gICAgICB2YXIgc3RhdHMgPSBvcHRpb25zID8gb3JpZy5jYWxsKGZzLCB0YXJnZXQsIG9wdGlvbnMpXG4gICAgICAgIDogb3JpZy5jYWxsKGZzLCB0YXJnZXQpXG4gICAgICBpZiAoc3RhdHMpIHtcbiAgICAgICAgaWYgKHN0YXRzLnVpZCA8IDApIHN0YXRzLnVpZCArPSAweDEwMDAwMDAwMFxuICAgICAgICBpZiAoc3RhdHMuZ2lkIDwgMCkgc3RhdHMuZ2lkICs9IDB4MTAwMDAwMDAwXG4gICAgICB9XG4gICAgICByZXR1cm4gc3RhdHM7XG4gICAgfVxuICB9XG5cbiAgLy8gRU5PU1lTIG1lYW5zIHRoYXQgdGhlIGZzIGRvZXNuJ3Qgc3VwcG9ydCB0aGUgb3AuIEp1c3QgaWdub3JlXG4gIC8vIHRoYXQsIGJlY2F1c2UgaXQgZG9lc24ndCBtYXR0ZXIuXG4gIC8vXG4gIC8vIGlmIHRoZXJlJ3Mgbm8gZ2V0dWlkLCBvciBpZiBnZXR1aWQoKSBpcyBzb21ldGhpbmcgb3RoZXJcbiAgLy8gdGhhbiAwLCBhbmQgdGhlIGVycm9yIGlzIEVJTlZBTCBvciBFUEVSTSwgdGhlbiBqdXN0IGlnbm9yZVxuICAvLyBpdC5cbiAgLy9cbiAgLy8gVGhpcyBzcGVjaWZpYyBjYXNlIGlzIGEgc2lsZW50IGZhaWx1cmUgaW4gY3AsIGluc3RhbGwsIHRhcixcbiAgLy8gYW5kIG1vc3Qgb3RoZXIgdW5peCB0b29scyB0aGF0IG1hbmFnZSBwZXJtaXNzaW9ucy5cbiAgLy9cbiAgLy8gV2hlbiBydW5uaW5nIGFzIHJvb3QsIG9yIGlmIG90aGVyIHR5cGVzIG9mIGVycm9ycyBhcmVcbiAgLy8gZW5jb3VudGVyZWQsIHRoZW4gaXQncyBzdHJpY3QuXG4gIGZ1bmN0aW9uIGNob3duRXJPayAoZXIpIHtcbiAgICBpZiAoIWVyKVxuICAgICAgcmV0dXJuIHRydWVcblxuICAgIGlmIChlci5jb2RlID09PSBcIkVOT1NZU1wiKVxuICAgICAgcmV0dXJuIHRydWVcblxuICAgIHZhciBub25yb290ID0gIXByb2Nlc3MuZ2V0dWlkIHx8IHByb2Nlc3MuZ2V0dWlkKCkgIT09IDBcbiAgICBpZiAobm9ucm9vdCkge1xuICAgICAgaWYgKGVyLmNvZGUgPT09IFwiRUlOVkFMXCIgfHwgZXIuY29kZSA9PT0gXCJFUEVSTVwiKVxuICAgICAgICByZXR1cm4gdHJ1ZVxuICAgIH1cblxuICAgIHJldHVybiBmYWxzZVxuICB9XG59XG4iLCJsZXQgX2ZzXG50cnkge1xuICBfZnMgPSByZXF1aXJlKCdncmFjZWZ1bC1mcycpXG59IGNhdGNoIChfKSB7XG4gIF9mcyA9IHJlcXVpcmUoJ2ZzJylcbn1cbmNvbnN0IHVuaXZlcnNhbGlmeSA9IHJlcXVpcmUoJ3VuaXZlcnNhbGlmeScpXG5jb25zdCB7IHN0cmluZ2lmeSwgc3RyaXBCb20gfSA9IHJlcXVpcmUoJy4vdXRpbHMnKVxuXG5hc3luYyBmdW5jdGlvbiBfcmVhZEZpbGUgKGZpbGUsIG9wdGlvbnMgPSB7fSkge1xuICBpZiAodHlwZW9mIG9wdGlvbnMgPT09ICdzdHJpbmcnKSB7XG4gICAgb3B0aW9ucyA9IHsgZW5jb2Rpbmc6IG9wdGlvbnMgfVxuICB9XG5cbiAgY29uc3QgZnMgPSBvcHRpb25zLmZzIHx8IF9mc1xuXG4gIGNvbnN0IHNob3VsZFRocm93ID0gJ3Rocm93cycgaW4gb3B0aW9ucyA/IG9wdGlvbnMudGhyb3dzIDogdHJ1ZVxuXG4gIGxldCBkYXRhID0gYXdhaXQgdW5pdmVyc2FsaWZ5LmZyb21DYWxsYmFjayhmcy5yZWFkRmlsZSkoZmlsZSwgb3B0aW9ucylcblxuICBkYXRhID0gc3RyaXBCb20oZGF0YSlcblxuICBsZXQgb2JqXG4gIHRyeSB7XG4gICAgb2JqID0gSlNPTi5wYXJzZShkYXRhLCBvcHRpb25zID8gb3B0aW9ucy5yZXZpdmVyIDogbnVsbClcbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgaWYgKHNob3VsZFRocm93KSB7XG4gICAgICBlcnIubWVzc2FnZSA9IGAke2ZpbGV9OiAke2Vyci5tZXNzYWdlfWBcbiAgICAgIHRocm93IGVyclxuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gbnVsbFxuICAgIH1cbiAgfVxuXG4gIHJldHVybiBvYmpcbn1cblxuY29uc3QgcmVhZEZpbGUgPSB1bml2ZXJzYWxpZnkuZnJvbVByb21pc2UoX3JlYWRGaWxlKVxuXG5mdW5jdGlvbiByZWFkRmlsZVN5bmMgKGZpbGUsIG9wdGlvbnMgPSB7fSkge1xuICBpZiAodHlwZW9mIG9wdGlvbnMgPT09ICdzdHJpbmcnKSB7XG4gICAgb3B0aW9ucyA9IHsgZW5jb2Rpbmc6IG9wdGlvbnMgfVxuICB9XG5cbiAgY29uc3QgZnMgPSBvcHRpb25zLmZzIHx8IF9mc1xuXG4gIGNvbnN0IHNob3VsZFRocm93ID0gJ3Rocm93cycgaW4gb3B0aW9ucyA/IG9wdGlvbnMudGhyb3dzIDogdHJ1ZVxuXG4gIHRyeSB7XG4gICAgbGV0IGNvbnRlbnQgPSBmcy5yZWFkRmlsZVN5bmMoZmlsZSwgb3B0aW9ucylcbiAgICBjb250ZW50ID0gc3RyaXBCb20oY29udGVudClcbiAgICByZXR1cm4gSlNPTi5wYXJzZShjb250ZW50LCBvcHRpb25zLnJldml2ZXIpXG4gIH0gY2F0Y2ggKGVycikge1xuICAgIGlmIChzaG91bGRUaHJvdykge1xuICAgICAgZXJyLm1lc3NhZ2UgPSBgJHtmaWxlfTogJHtlcnIubWVzc2FnZX1gXG4gICAgICB0aHJvdyBlcnJcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIG51bGxcbiAgICB9XG4gIH1cbn1cblxuYXN5bmMgZnVuY3Rpb24gX3dyaXRlRmlsZSAoZmlsZSwgb2JqLCBvcHRpb25zID0ge30pIHtcbiAgY29uc3QgZnMgPSBvcHRpb25zLmZzIHx8IF9mc1xuXG4gIGNvbnN0IHN0ciA9IHN0cmluZ2lmeShvYmosIG9wdGlvbnMpXG5cbiAgYXdhaXQgdW5pdmVyc2FsaWZ5LmZyb21DYWxsYmFjayhmcy53cml0ZUZpbGUpKGZpbGUsIHN0ciwgb3B0aW9ucylcbn1cblxuY29uc3Qgd3JpdGVGaWxlID0gdW5pdmVyc2FsaWZ5LmZyb21Qcm9taXNlKF93cml0ZUZpbGUpXG5cbmZ1bmN0aW9uIHdyaXRlRmlsZVN5bmMgKGZpbGUsIG9iaiwgb3B0aW9ucyA9IHt9KSB7XG4gIGNvbnN0IGZzID0gb3B0aW9ucy5mcyB8fCBfZnNcblxuICBjb25zdCBzdHIgPSBzdHJpbmdpZnkob2JqLCBvcHRpb25zKVxuICAvLyBub3Qgc3VyZSBpZiBmcy53cml0ZUZpbGVTeW5jIHJldHVybnMgYW55dGhpbmcsIGJ1dCBqdXN0IGluIGNhc2VcbiAgcmV0dXJuIGZzLndyaXRlRmlsZVN5bmMoZmlsZSwgc3RyLCBvcHRpb25zKVxufVxuXG5jb25zdCBqc29uZmlsZSA9IHtcbiAgcmVhZEZpbGUsXG4gIHJlYWRGaWxlU3luYyxcbiAgd3JpdGVGaWxlLFxuICB3cml0ZUZpbGVTeW5jXG59XG5cbm1vZHVsZS5leHBvcnRzID0ganNvbmZpbGVcbiIsImZ1bmN0aW9uIHN0cmluZ2lmeSAob2JqLCB7IEVPTCA9ICdcXG4nLCBmaW5hbEVPTCA9IHRydWUsIHJlcGxhY2VyID0gbnVsbCwgc3BhY2VzIH0gPSB7fSkge1xuICBjb25zdCBFT0YgPSBmaW5hbEVPTCA/IEVPTCA6ICcnXG4gIGNvbnN0IHN0ciA9IEpTT04uc3RyaW5naWZ5KG9iaiwgcmVwbGFjZXIsIHNwYWNlcylcblxuICByZXR1cm4gc3RyLnJlcGxhY2UoL1xcbi9nLCBFT0wpICsgRU9GXG59XG5cbmZ1bmN0aW9uIHN0cmlwQm9tIChjb250ZW50KSB7XG4gIC8vIHdlIGRvIHRoaXMgYmVjYXVzZSBKU09OLnBhcnNlIHdvdWxkIGNvbnZlcnQgaXQgdG8gYSB1dGY4IHN0cmluZyBpZiBlbmNvZGluZyB3YXNuJ3Qgc3BlY2lmaWVkXG4gIGlmIChCdWZmZXIuaXNCdWZmZXIoY29udGVudCkpIGNvbnRlbnQgPSBjb250ZW50LnRvU3RyaW5nKCd1dGY4JylcbiAgcmV0dXJuIGNvbnRlbnQucmVwbGFjZSgvXlxcdUZFRkYvLCAnJylcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7IHN0cmluZ2lmeSwgc3RyaXBCb20gfVxuIiwiLyogZXNsaW50LWRpc2FibGUgbm8tbmVzdGVkLXRlcm5hcnkgKi9cbid1c2Ugc3RyaWN0JztcbnZhciBhcnIgPSBbXTtcbnZhciBjaGFyQ29kZUNhY2hlID0gW107XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKGEsIGIpIHtcblx0aWYgKGEgPT09IGIpIHtcblx0XHRyZXR1cm4gMDtcblx0fVxuXG5cdHZhciBzd2FwID0gYTtcblxuXHQvLyBTd2FwcGluZyB0aGUgc3RyaW5ncyBpZiBgYWAgaXMgbG9uZ2VyIHRoYW4gYGJgIHNvIHdlIGtub3cgd2hpY2ggb25lIGlzIHRoZVxuXHQvLyBzaG9ydGVzdCAmIHdoaWNoIG9uZSBpcyB0aGUgbG9uZ2VzdFxuXHRpZiAoYS5sZW5ndGggPiBiLmxlbmd0aCkge1xuXHRcdGEgPSBiO1xuXHRcdGIgPSBzd2FwO1xuXHR9XG5cblx0dmFyIGFMZW4gPSBhLmxlbmd0aDtcblx0dmFyIGJMZW4gPSBiLmxlbmd0aDtcblxuXHRpZiAoYUxlbiA9PT0gMCkge1xuXHRcdHJldHVybiBiTGVuO1xuXHR9XG5cblx0aWYgKGJMZW4gPT09IDApIHtcblx0XHRyZXR1cm4gYUxlbjtcblx0fVxuXG5cdC8vIFBlcmZvcm1pbmcgc3VmZml4IHRyaW1taW5nOlxuXHQvLyBXZSBjYW4gbGluZWFybHkgZHJvcCBzdWZmaXggY29tbW9uIHRvIGJvdGggc3RyaW5ncyBzaW5jZSB0aGV5XG5cdC8vIGRvbid0IGluY3JlYXNlIGRpc3RhbmNlIGF0IGFsbFxuXHQvLyBOb3RlOiBgfi1gIGlzIHRoZSBiaXR3aXNlIHdheSB0byBwZXJmb3JtIGEgYC0gMWAgb3BlcmF0aW9uXG5cdHdoaWxlIChhTGVuID4gMCAmJiAoYS5jaGFyQ29kZUF0KH4tYUxlbikgPT09IGIuY2hhckNvZGVBdCh+LWJMZW4pKSkge1xuXHRcdGFMZW4tLTtcblx0XHRiTGVuLS07XG5cdH1cblxuXHRpZiAoYUxlbiA9PT0gMCkge1xuXHRcdHJldHVybiBiTGVuO1xuXHR9XG5cblx0Ly8gUGVyZm9ybWluZyBwcmVmaXggdHJpbW1pbmdcblx0Ly8gV2UgY2FuIGxpbmVhcmx5IGRyb3AgcHJlZml4IGNvbW1vbiB0byBib3RoIHN0cmluZ3Mgc2luY2UgdGhleVxuXHQvLyBkb24ndCBpbmNyZWFzZSBkaXN0YW5jZSBhdCBhbGxcblx0dmFyIHN0YXJ0ID0gMDtcblxuXHR3aGlsZSAoc3RhcnQgPCBhTGVuICYmIChhLmNoYXJDb2RlQXQoc3RhcnQpID09PSBiLmNoYXJDb2RlQXQoc3RhcnQpKSkge1xuXHRcdHN0YXJ0Kys7XG5cdH1cblxuXHRhTGVuIC09IHN0YXJ0O1xuXHRiTGVuIC09IHN0YXJ0O1xuXG5cdGlmIChhTGVuID09PSAwKSB7XG5cdFx0cmV0dXJuIGJMZW47XG5cdH1cblxuXHR2YXIgYkNoYXJDb2RlO1xuXHR2YXIgcmV0O1xuXHR2YXIgdG1wO1xuXHR2YXIgdG1wMjtcblx0dmFyIGkgPSAwO1xuXHR2YXIgaiA9IDA7XG5cblx0d2hpbGUgKGkgPCBhTGVuKSB7XG5cdFx0Y2hhckNvZGVDYWNoZVtzdGFydCArIGldID0gYS5jaGFyQ29kZUF0KHN0YXJ0ICsgaSk7XG5cdFx0YXJyW2ldID0gKytpO1xuXHR9XG5cblx0d2hpbGUgKGogPCBiTGVuKSB7XG5cdFx0YkNoYXJDb2RlID0gYi5jaGFyQ29kZUF0KHN0YXJ0ICsgaik7XG5cdFx0dG1wID0gaisrO1xuXHRcdHJldCA9IGo7XG5cblx0XHRmb3IgKGkgPSAwOyBpIDwgYUxlbjsgaSsrKSB7XG5cdFx0XHR0bXAyID0gYkNoYXJDb2RlID09PSBjaGFyQ29kZUNhY2hlW3N0YXJ0ICsgaV0gPyB0bXAgOiB0bXAgKyAxO1xuXHRcdFx0dG1wID0gYXJyW2ldO1xuXHRcdFx0cmV0ID0gYXJyW2ldID0gdG1wID4gcmV0ID8gdG1wMiA+IHJldCA/IHJldCArIDEgOiB0bXAyIDogdG1wMiA+IHRtcCA/IHRtcCArIDEgOiB0bXAyO1xuXHRcdH1cblx0fVxuXG5cdHJldHVybiByZXQ7XG59O1xuIiwiZnVuY3Rpb24gdG9BcnIoYW55KSB7XG5cdHJldHVybiBhbnkgPT0gbnVsbCA/IFtdIDogQXJyYXkuaXNBcnJheShhbnkpID8gYW55IDogW2FueV07XG59XG5cbmZ1bmN0aW9uIHRvVmFsKG91dCwga2V5LCB2YWwsIG9wdHMpIHtcblx0dmFyIHgsIG9sZD1vdXRba2V5XSwgbnh0PShcblx0XHQhIX5vcHRzLnN0cmluZy5pbmRleE9mKGtleSkgPyAodmFsID09IG51bGwgfHwgdmFsID09PSB0cnVlID8gJycgOiBTdHJpbmcodmFsKSlcblx0XHQ6IHR5cGVvZiB2YWwgPT09ICdib29sZWFuJyA/IHZhbFxuXHRcdDogISF+b3B0cy5ib29sZWFuLmluZGV4T2Yoa2V5KSA/ICh2YWwgPT09ICdmYWxzZScgPyBmYWxzZSA6IHZhbCA9PT0gJ3RydWUnIHx8IChvdXQuXy5wdXNoKCh4ID0gK3ZhbCx4ICogMCA9PT0gMCkgPyB4IDogdmFsKSwhIXZhbCkpXG5cdFx0OiAoeCA9ICt2YWwseCAqIDAgPT09IDApID8geCA6IHZhbFxuXHQpO1xuXHRvdXRba2V5XSA9IG9sZCA9PSBudWxsID8gbnh0IDogKEFycmF5LmlzQXJyYXkob2xkKSA/IG9sZC5jb25jYXQobnh0KSA6IFtvbGQsIG54dF0pO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChhcmdzLCBvcHRzKSB7XG5cdGFyZ3MgPSBhcmdzIHx8IFtdO1xuXHRvcHRzID0gb3B0cyB8fCB7fTtcblxuXHR2YXIgaywgYXJyLCBhcmcsIG5hbWUsIHZhbCwgb3V0PXsgXzpbXSB9O1xuXHR2YXIgaT0wLCBqPTAsIGlkeD0wLCBsZW49YXJncy5sZW5ndGg7XG5cblx0Y29uc3QgYWxpYmkgPSBvcHRzLmFsaWFzICE9PSB2b2lkIDA7XG5cdGNvbnN0IHN0cmljdCA9IG9wdHMudW5rbm93biAhPT0gdm9pZCAwO1xuXHRjb25zdCBkZWZhdWx0cyA9IG9wdHMuZGVmYXVsdCAhPT0gdm9pZCAwO1xuXG5cdG9wdHMuYWxpYXMgPSBvcHRzLmFsaWFzIHx8IHt9O1xuXHRvcHRzLnN0cmluZyA9IHRvQXJyKG9wdHMuc3RyaW5nKTtcblx0b3B0cy5ib29sZWFuID0gdG9BcnIob3B0cy5ib29sZWFuKTtcblxuXHRpZiAoYWxpYmkpIHtcblx0XHRmb3IgKGsgaW4gb3B0cy5hbGlhcykge1xuXHRcdFx0YXJyID0gb3B0cy5hbGlhc1trXSA9IHRvQXJyKG9wdHMuYWxpYXNba10pO1xuXHRcdFx0Zm9yIChpPTA7IGkgPCBhcnIubGVuZ3RoOyBpKyspIHtcblx0XHRcdFx0KG9wdHMuYWxpYXNbYXJyW2ldXSA9IGFyci5jb25jYXQoaykpLnNwbGljZShpLCAxKTtcblx0XHRcdH1cblx0XHR9XG5cdH1cblxuXHRvcHRzLmJvb2xlYW4uZm9yRWFjaChrZXkgPT4ge1xuXHRcdG9wdHMuYm9vbGVhbiA9IG9wdHMuYm9vbGVhbi5jb25jYXQob3B0cy5hbGlhc1trZXldID0gb3B0cy5hbGlhc1trZXldIHx8IFtdKTtcblx0fSk7XG5cblx0b3B0cy5zdHJpbmcuZm9yRWFjaChrZXkgPT4ge1xuXHRcdG9wdHMuc3RyaW5nID0gb3B0cy5zdHJpbmcuY29uY2F0KG9wdHMuYWxpYXNba2V5XSA9IG9wdHMuYWxpYXNba2V5XSB8fCBbXSk7XG5cdH0pO1xuXG5cdGlmIChkZWZhdWx0cykge1xuXHRcdGZvciAoayBpbiBvcHRzLmRlZmF1bHQpIHtcblx0XHRcdG9wdHMuYWxpYXNba10gPSBvcHRzLmFsaWFzW2tdIHx8IFtdO1xuXHRcdFx0KG9wdHNbdHlwZW9mIG9wdHMuZGVmYXVsdFtrXV0gfHwgW10pLnB1c2goayk7XG5cdFx0fVxuXHR9XG5cblx0Y29uc3Qga2V5cyA9IHN0cmljdCA/IE9iamVjdC5rZXlzKG9wdHMuYWxpYXMpIDogW107XG5cblx0Zm9yIChpPTA7IGkgPCBsZW47IGkrKykge1xuXHRcdGFyZyA9IGFyZ3NbaV07XG5cblx0XHRpZiAoYXJnID09PSAnLS0nKSB7XG5cdFx0XHRvdXQuXyA9IG91dC5fLmNvbmNhdChhcmdzLnNsaWNlKCsraSkpO1xuXHRcdFx0YnJlYWs7XG5cdFx0fVxuXG5cdFx0Zm9yIChqPTA7IGogPCBhcmcubGVuZ3RoOyBqKyspIHtcblx0XHRcdGlmIChhcmcuY2hhckNvZGVBdChqKSAhPT0gNDUpIGJyZWFrOyAvLyBcIi1cIlxuXHRcdH1cblxuXHRcdGlmIChqID09PSAwKSB7XG5cdFx0XHRvdXQuXy5wdXNoKGFyZyk7XG5cdFx0fSBlbHNlIGlmIChhcmcuc3Vic3RyaW5nKGosIGogKyAzKSA9PT0gJ25vLScpIHtcblx0XHRcdG5hbWUgPSBhcmcuc3Vic3RyaW5nKGogKyAzKTtcblx0XHRcdGlmIChzdHJpY3QgJiYgIX5rZXlzLmluZGV4T2YobmFtZSkpIHtcblx0XHRcdFx0cmV0dXJuIG9wdHMudW5rbm93bihhcmcpO1xuXHRcdFx0fVxuXHRcdFx0b3V0W25hbWVdID0gZmFsc2U7XG5cdFx0fSBlbHNlIHtcblx0XHRcdGZvciAoaWR4PWorMTsgaWR4IDwgYXJnLmxlbmd0aDsgaWR4KyspIHtcblx0XHRcdFx0aWYgKGFyZy5jaGFyQ29kZUF0KGlkeCkgPT09IDYxKSBicmVhazsgLy8gXCI9XCJcblx0XHRcdH1cblxuXHRcdFx0bmFtZSA9IGFyZy5zdWJzdHJpbmcoaiwgaWR4KTtcblx0XHRcdHZhbCA9IGFyZy5zdWJzdHJpbmcoKytpZHgpIHx8IChpKzEgPT09IGxlbiB8fCAoJycrYXJnc1tpKzFdKS5jaGFyQ29kZUF0KDApID09PSA0NSB8fCBhcmdzWysraV0pO1xuXHRcdFx0YXJyID0gKGogPT09IDIgPyBbbmFtZV0gOiBuYW1lKTtcblxuXHRcdFx0Zm9yIChpZHg9MDsgaWR4IDwgYXJyLmxlbmd0aDsgaWR4KyspIHtcblx0XHRcdFx0bmFtZSA9IGFycltpZHhdO1xuXHRcdFx0XHRpZiAoc3RyaWN0ICYmICF+a2V5cy5pbmRleE9mKG5hbWUpKSByZXR1cm4gb3B0cy51bmtub3duKCctJy5yZXBlYXQoaikgKyBuYW1lKTtcblx0XHRcdFx0dG9WYWwob3V0LCBuYW1lLCAoaWR4ICsgMSA8IGFyci5sZW5ndGgpIHx8IHZhbCwgb3B0cyk7XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cblx0aWYgKGRlZmF1bHRzKSB7XG5cdFx0Zm9yIChrIGluIG9wdHMuZGVmYXVsdCkge1xuXHRcdFx0aWYgKG91dFtrXSA9PT0gdm9pZCAwKSB7XG5cdFx0XHRcdG91dFtrXSA9IG9wdHMuZGVmYXVsdFtrXTtcblx0XHRcdH1cblx0XHR9XG5cdH1cblxuXHRpZiAoYWxpYmkpIHtcblx0XHRmb3IgKGsgaW4gb3V0KSB7XG5cdFx0XHRhcnIgPSBvcHRzLmFsaWFzW2tdIHx8IFtdO1xuXHRcdFx0d2hpbGUgKGFyci5sZW5ndGggPiAwKSB7XG5cdFx0XHRcdG91dFthcnIuc2hpZnQoKV0gPSBvdXRba107XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cblx0cmV0dXJuIG91dDtcbn1cbiIsImNvbnN0IHsgZXhlYywgZXhlY1N5bmMgfSA9IHJlcXVpcmUoJ2NoaWxkX3Byb2Nlc3MnKTsgXHJcblxyXG5jb25zdCBjb21tYW5kbGluZT17XHJcbiAgICBydW46cnVuQ29tbWFuZCxcclxuICAgIHJ1blN5bmM6cnVuU3luYyxcclxufTtcclxuXHJcbmZ1bmN0aW9uIHJ1bkNvbW1hbmQoY29tbWFuZCxjYWxsYmFjayl7XHJcbiAgICBcclxuICAgIHJldHVybiBleGVjKFxyXG4gICAgICAgIGNvbW1hbmQsXHJcbiAgICAgICAgKFxyXG4gICAgICAgICAgICBmdW5jdGlvbigpe1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKGVycixkYXRhLHN0ZGVycil7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYoIWNhbGxiYWNrKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrKGVyciwgZGF0YSwgc3RkZXJyKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICkoY2FsbGJhY2spXHJcbiAgICApO1xyXG59XHJcblxyXG5mdW5jdGlvbiBydW5TeW5jKGNvbW1hbmQpe1xyXG4gICAgdHJ5IHtcclxuICAgICAgICByZXR1cm4geyBcclxuICAgICAgICAgICAgZGF0YTogICBleGVjU3luYyhjb21tYW5kKS50b1N0cmluZygpLCBcclxuICAgICAgICAgICAgZXJyOiAgICBudWxsLCBcclxuICAgICAgICAgICAgc3RkZXJyOiBudWxsIFxyXG4gICAgICAgIH1cclxuICAgIH0gXHJcbiAgICBjYXRjaCAoZXJyb3IpIHtcclxuICAgICAgICByZXR1cm4geyBcclxuICAgICAgICAgICAgZGF0YTogICBudWxsLCBcclxuICAgICAgICAgICAgZXJyOiAgICBlcnJvci5zdGRlcnIudG9TdHJpbmcoKSwgXHJcbiAgICAgICAgICAgIHN0ZGVycjogZXJyb3Iuc3RkZXJyLnRvU3RyaW5nKCkgXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cz1jb21tYW5kbGluZTtcclxuIiwiJ3VzZSBzdHJpY3QnO1xuXG5jb25zdCBwcm9jZXNzRm4gPSAoZm4sIG9wdHMpID0+IGZ1bmN0aW9uICgpIHtcblx0Y29uc3QgUCA9IG9wdHMucHJvbWlzZU1vZHVsZTtcblx0Y29uc3QgYXJncyA9IG5ldyBBcnJheShhcmd1bWVudHMubGVuZ3RoKTtcblxuXHRmb3IgKGxldCBpID0gMDsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykge1xuXHRcdGFyZ3NbaV0gPSBhcmd1bWVudHNbaV07XG5cdH1cblxuXHRyZXR1cm4gbmV3IFAoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuXHRcdGlmIChvcHRzLmVycm9yRmlyc3QpIHtcblx0XHRcdGFyZ3MucHVzaChmdW5jdGlvbiAoZXJyLCByZXN1bHQpIHtcblx0XHRcdFx0aWYgKG9wdHMubXVsdGlBcmdzKSB7XG5cdFx0XHRcdFx0Y29uc3QgcmVzdWx0cyA9IG5ldyBBcnJheShhcmd1bWVudHMubGVuZ3RoIC0gMSk7XG5cblx0XHRcdFx0XHRmb3IgKGxldCBpID0gMTsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykge1xuXHRcdFx0XHRcdFx0cmVzdWx0c1tpIC0gMV0gPSBhcmd1bWVudHNbaV07XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0aWYgKGVycikge1xuXHRcdFx0XHRcdFx0cmVzdWx0cy51bnNoaWZ0KGVycik7XG5cdFx0XHRcdFx0XHRyZWplY3QocmVzdWx0cyk7XG5cdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdHJlc29sdmUocmVzdWx0cyk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9IGVsc2UgaWYgKGVycikge1xuXHRcdFx0XHRcdHJlamVjdChlcnIpO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdHJlc29sdmUocmVzdWx0KTtcblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdGFyZ3MucHVzaChmdW5jdGlvbiAocmVzdWx0KSB7XG5cdFx0XHRcdGlmIChvcHRzLm11bHRpQXJncykge1xuXHRcdFx0XHRcdGNvbnN0IHJlc3VsdHMgPSBuZXcgQXJyYXkoYXJndW1lbnRzLmxlbmd0aCAtIDEpO1xuXG5cdFx0XHRcdFx0Zm9yIChsZXQgaSA9IDA7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcblx0XHRcdFx0XHRcdHJlc3VsdHNbaV0gPSBhcmd1bWVudHNbaV07XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0cmVzb2x2ZShyZXN1bHRzKTtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRyZXNvbHZlKHJlc3VsdCk7XG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXHRcdH1cblxuXHRcdGZuLmFwcGx5KHRoaXMsIGFyZ3MpO1xuXHR9KTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gKG9iaiwgb3B0cykgPT4ge1xuXHRvcHRzID0gT2JqZWN0LmFzc2lnbih7XG5cdFx0ZXhjbHVkZTogWy8uKyhTeW5jfFN0cmVhbSkkL10sXG5cdFx0ZXJyb3JGaXJzdDogdHJ1ZSxcblx0XHRwcm9taXNlTW9kdWxlOiBQcm9taXNlXG5cdH0sIG9wdHMpO1xuXG5cdGNvbnN0IGZpbHRlciA9IGtleSA9PiB7XG5cdFx0Y29uc3QgbWF0Y2ggPSBwYXR0ZXJuID0+IHR5cGVvZiBwYXR0ZXJuID09PSAnc3RyaW5nJyA/IGtleSA9PT0gcGF0dGVybiA6IHBhdHRlcm4udGVzdChrZXkpO1xuXHRcdHJldHVybiBvcHRzLmluY2x1ZGUgPyBvcHRzLmluY2x1ZGUuc29tZShtYXRjaCkgOiAhb3B0cy5leGNsdWRlLnNvbWUobWF0Y2gpO1xuXHR9O1xuXG5cdGxldCByZXQ7XG5cdGlmICh0eXBlb2Ygb2JqID09PSAnZnVuY3Rpb24nKSB7XG5cdFx0cmV0ID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0aWYgKG9wdHMuZXhjbHVkZU1haW4pIHtcblx0XHRcdFx0cmV0dXJuIG9iai5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuXHRcdFx0fVxuXG5cdFx0XHRyZXR1cm4gcHJvY2Vzc0ZuKG9iaiwgb3B0cykuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcblx0XHR9O1xuXHR9IGVsc2Uge1xuXHRcdHJldCA9IE9iamVjdC5jcmVhdGUoT2JqZWN0LmdldFByb3RvdHlwZU9mKG9iaikpO1xuXHR9XG5cblx0Zm9yIChjb25zdCBrZXkgaW4gb2JqKSB7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgZ3VhcmQtZm9yLWluXG5cdFx0Y29uc3QgeCA9IG9ialtrZXldO1xuXHRcdHJldFtrZXldID0gdHlwZW9mIHggPT09ICdmdW5jdGlvbicgJiYgZmlsdGVyKGtleSkgPyBwcm9jZXNzRm4oeCwgb3B0cykgOiB4O1xuXHR9XG5cblx0cmV0dXJuIHJldDtcbn07XG4iLCIndXNlIHN0cmljdCdcblxuZXhwb3J0cy5mcm9tQ2FsbGJhY2sgPSBmdW5jdGlvbiAoZm4pIHtcbiAgcmV0dXJuIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShmdW5jdGlvbiAoLi4uYXJncykge1xuICAgIGlmICh0eXBlb2YgYXJnc1thcmdzLmxlbmd0aCAtIDFdID09PSAnZnVuY3Rpb24nKSBmbi5hcHBseSh0aGlzLCBhcmdzKVxuICAgIGVsc2Uge1xuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgZm4uY2FsbChcbiAgICAgICAgICB0aGlzLFxuICAgICAgICAgIC4uLmFyZ3MsXG4gICAgICAgICAgKGVyciwgcmVzKSA9PiAoZXJyICE9IG51bGwpID8gcmVqZWN0KGVycikgOiByZXNvbHZlKHJlcylcbiAgICAgICAgKVxuICAgICAgfSlcbiAgICB9XG4gIH0sICduYW1lJywgeyB2YWx1ZTogZm4ubmFtZSB9KVxufVxuXG5leHBvcnRzLmZyb21Qcm9taXNlID0gZnVuY3Rpb24gKGZuKSB7XG4gIHJldHVybiBPYmplY3QuZGVmaW5lUHJvcGVydHkoZnVuY3Rpb24gKC4uLmFyZ3MpIHtcbiAgICBjb25zdCBjYiA9IGFyZ3NbYXJncy5sZW5ndGggLSAxXVxuICAgIGlmICh0eXBlb2YgY2IgIT09ICdmdW5jdGlvbicpIHJldHVybiBmbi5hcHBseSh0aGlzLCBhcmdzKVxuICAgIGVsc2UgZm4uYXBwbHkodGhpcywgYXJncy5zbGljZSgwLCAtMSkpLnRoZW4ociA9PiBjYihudWxsLCByKSwgY2IpXG4gIH0sICduYW1lJywgeyB2YWx1ZTogZm4ubmFtZSB9KVxufVxuIiwibW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKFwidHNsaWJcIik7IiwibW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKFwiYXNzZXJ0XCIpOyIsIm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZShcImNoaWxkX3Byb2Nlc3NcIik7IiwibW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKFwiY29uc3RhbnRzXCIpOyIsIm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZShcImVsZWN0cm9uXCIpOyIsIm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZShcImZzXCIpOyIsIm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZShcIm9zXCIpOyIsIm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZShcInBhdGhcIik7IiwibW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKFwic3RyZWFtXCIpOyIsIm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZShcInV0aWxcIik7IiwiLy8gVGhlIG1vZHVsZSBjYWNoZVxudmFyIF9fd2VicGFja19tb2R1bGVfY2FjaGVfXyA9IHt9O1xuXG4vLyBUaGUgcmVxdWlyZSBmdW5jdGlvblxuZnVuY3Rpb24gX193ZWJwYWNrX3JlcXVpcmVfXyhtb2R1bGVJZCkge1xuXHQvLyBDaGVjayBpZiBtb2R1bGUgaXMgaW4gY2FjaGVcblx0dmFyIGNhY2hlZE1vZHVsZSA9IF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF07XG5cdGlmIChjYWNoZWRNb2R1bGUgIT09IHVuZGVmaW5lZCkge1xuXHRcdHJldHVybiBjYWNoZWRNb2R1bGUuZXhwb3J0cztcblx0fVxuXHQvLyBDcmVhdGUgYSBuZXcgbW9kdWxlIChhbmQgcHV0IGl0IGludG8gdGhlIGNhY2hlKVxuXHR2YXIgbW9kdWxlID0gX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fW21vZHVsZUlkXSA9IHtcblx0XHRpZDogbW9kdWxlSWQsXG5cdFx0bG9hZGVkOiBmYWxzZSxcblx0XHRleHBvcnRzOiB7fVxuXHR9O1xuXG5cdC8vIEV4ZWN1dGUgdGhlIG1vZHVsZSBmdW5jdGlvblxuXHRfX3dlYnBhY2tfbW9kdWxlc19fW21vZHVsZUlkXShtb2R1bGUsIG1vZHVsZS5leHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKTtcblxuXHQvLyBGbGFnIHRoZSBtb2R1bGUgYXMgbG9hZGVkXG5cdG1vZHVsZS5sb2FkZWQgPSB0cnVlO1xuXG5cdC8vIFJldHVybiB0aGUgZXhwb3J0cyBvZiB0aGUgbW9kdWxlXG5cdHJldHVybiBtb2R1bGUuZXhwb3J0cztcbn1cblxuIiwiX193ZWJwYWNrX3JlcXVpcmVfXy5vID0gKG9iaiwgcHJvcCkgPT4gKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvYmosIHByb3ApKSIsIl9fd2VicGFja19yZXF1aXJlX18ubm1kID0gKG1vZHVsZSkgPT4ge1xuXHRtb2R1bGUucGF0aHMgPSBbXTtcblx0aWYgKCFtb2R1bGUuY2hpbGRyZW4pIG1vZHVsZS5jaGlsZHJlbiA9IFtdO1xuXHRyZXR1cm4gbW9kdWxlO1xufTsiLCIvLyBUaGlzIGlzIGEgQ0xJIHRvb2wsIHVzaW5nIGNvbnNvbGUgaXMgT0tcbi8qIGVzbGludCBuby1jb25zb2xlOiAwICovXG5pbXBvcnQge3NwYXduLCBleGVjfSBmcm9tICdjaGlsZF9wcm9jZXNzJztcbmNvbnN0IHsgYXBwIH0gPSByZXF1aXJlKCdlbGVjdHJvbicpO1xuaW1wb3J0IHBpZnkgZnJvbSAncGlmeSc7XG5pbXBvcnQgYXJncyBmcm9tICdhcmdzJztcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xuaW1wb3J0ICBmcyAgZnJvbSAnZnMtZXh0cmEnO1xuaW1wb3J0IGNtZCBmcm9tICdub2RlLWNtZCc7XG5cblxuY29uc3QgYXBwTmFtZSA9IGFwcC5nZXROYW1lKCk7XG4vLyBhcmdzLmNvbW1hbmQoXG4vLyAgICdkZW50YWwnLFxuLy8gICAnT3BlbiB0aGUgZGVudGFsIHdlYnNpdGUnLFxuLy8gICAobmFtZTpzdHJpbmcsIGFyZ3NfOmFueSkgPT4ge1xuLy8gICAgIHZvaWQgb3BlbihgaHR0cHM6Ly93d3cuZGVudGFsM2RjbG91ZC5jb20vcC9pbmRleGAsIHt3YWl0OiBmYWxzZX0pO1xuLy8gICAgIHByb2Nlc3MuZXhpdCgwKTtcbi8vICAgfSxcbi8vICAgWydkJ11cbi8vICk7XG5cblxuLy8gYXJncy5jb21tYW5kKFxuLy8gICAncGFnZScsXG4vLyAgICdnbyB0byB0YXJnZXQgcGFnZScsXG4vLyAgIChuYW1lLCBhcmdzXykgPT4ge1xuLy8gXHRcdGlmIChwcm9jZXNzLnBsYXRmb3JtID09PSAnZGFyd2luJykge1xuLy8gXHRcdFx0Y29uc3QgYXBwcGF0aCA9IGAvQXBwbGljYXRpb25zLyR7YXBwTmFtZX0uYXBwYDtcbi8vIFx0XHRcdGNvbnNvbGUubG9nKCdhcmdzX2pvaW4gPT0gJyxhcmdzXy5qb2luKCcgJykpXG4vLyBcdFx0XHRjb25zdCBjbWQgPSBgb3BlbiAtYiBjby5zaGluaW5nLmFwcGJveCAtLWFyZ3MgJHthcmdzXy5qb2luKCcgJyl9YDtcbi8vIFx0XHRcdGNvbnNvbGUubG9nKCdjbWQgPSAnLGNtZClcbi8vIFx0XHRcdGV4ZWMoY21kKTtcbi8vIFx0XHRcdHByb2Nlc3MuZXhpdCgwKTtcbi8vIFx0XHR9ZWxzZXtcbi8vIFx0XHRcdGNvbnN0IGNoaWxkID0gc3Bhd24ocHJvY2Vzcy5leGVjUGF0aCwgYXJnc18pO1xuLy8gXHRcdFx0Y2hpbGQudW5yZWYoKTtcbi8vIFx0XHR9XG5cbi8vICAgfSxcbi8vICAgWydwJywnaCddXG4vLyApO1xuXG5cblxuYXJncy5jb21tYW5kKCc8ZGVmYXVsdD4nLCBgTGF1bmNoICR7YXBwTmFtZX1gKTtcblxuYXJncy5vcHRpb24oWyd2JywgJ3ZlcmJvc2UnXSwgJ1ZlcmJvc2UgbW9kZScsIGZhbHNlKTtcblxuYXJncy5jb21tYW5kKFxuICAndmVyc2lvbicsXG4gIGBTaG93IHRoZSB2ZXJzaW9uIG9mICR7YXBwTmFtZX1gLFxuICAoKSA9PiB7XG4gICAgY29uc3QgcGFja2FnZUpzb24gPSBmcy5yZWFkSlNPTlN5bmMocGF0aC5qb2luKF9fZGlybmFtZSwgJy4uLy4uL3BhY2thZ2UuanNvbicpKTtcbiAgICBjb25zb2xlLmxvZygn5Li76aG555uu5ZCN56ewID09ICcscGFja2FnZUpzb24udmVyc2lvbik7XG4gICAgY29uc29sZS5sb2coMS4wKTtcbiAgICBwcm9jZXNzLmV4aXQoMCk7XG4gIH0sXG4gIFtdXG4pO1xuXG5hcmdzLmNvbW1hbmQoXG4gICdvcGVuJyxcbiAgJ09wZW4gcmVsYXRlZCBzb2Z0d2FyZScsXG4gIChuYW1lOnN0cmluZywgYXJnc186YW55KT0+e1xuICAgIGlmIChwcm9jZXNzLnBsYXRmb3JtID09PSAnZGFyd2luJykge1xuXHRcdFx0Y29uc3QgYXBwcGF0aCA9ICcvQXBwbGljYXRpb25zL0RpbmdUYWxrLmFwcCc7XG5cdFx0XHRjb25zb2xlLmxvZygnYXJnc19qb2luID09ICcsYXJnc18uam9pbignICcpKVxuXHRcdFx0Y29uc3Qgc2NyaXB0ID0gYG9wZW4gJHthcHBwYXRofWA7XG4gICAgICBjbWQucnVuU3luYyhzY3JpcHQpO1xuXHRcdH1lbHNle1xuXHRcdFx0Y29uc29sZS5sb2coYG5hbWU9JHtuYW1lfSBhcmdzPSR7YXJnc199YCk7XG5cdFx0fVxuICAgIHByb2Nlc3MuZXhpdCgwKTtcbiAgfVxuKTtcblxuXG5jb25zdCBtYWluID0gKGFyZ3Y6YW55KSA9PiB7XG4gIGNvbnN0IGZsYWdzID0gYXJncy5wYXJzZShhcmd2LCB7XG4gICAgbmFtZTogYXBwTmFtZSxcbiAgICB2ZXJzaW9uOiBmYWxzZSxcbiAgICBtcmk6IHtcbiAgICAgIGJvb2xlYW46IFsndicsICd2ZXJib3NlJ11cbiAgICB9XG4gIH0pO1xuXG4gIGNvbnN0IGVudiA9IE9iamVjdC5hc3NpZ24oe30sIHByb2Nlc3MuZW52LCB7XG4gICAgLy8gdGhpcyB3aWxsIHNpZ25hbCAke2FwcE5hbWV9IHRoYXQgaXQgd2FzIHNwYXduZWQgZnJvbSB0aGlzIG1vZHVsZVxuICAgIFNISU5JTkdBUFBfQ0xJOiAnMScsXG4gICAgRUxFQ1RST05fTk9fQVRUQUNIX0NPTlNPTEU6ICcxJ1xuICB9KTtcblxuICBkZWxldGUgZW52WydFTEVDVFJPTl9SVU5fQVNfTk9ERSddO1xuXG4gIGlmIChmbGFncy52ZXJib3NlKSB7XG4gICAgZW52WydFTEVDVFJPTl9FTkFCTEVfTE9HR0lORyddID0gJzEnO1xuICB9XG5cbiAgY29uc3Qgb3B0aW9ucyA9IHtcbiAgICBkZXRhY2hlZDogdHJ1ZSxcbiAgICBlbnZcbiAgfTtcblxuICBjb25zdCBhcmdzXyA9IGFyZ3Muc3ViLm1hcCgoYXJnOmFueSkgPT4ge1xuICAgIC8vIGNvbnN0IGN3ZCA9IGlzQWJzb2x1dGUoYXJnKSA/IGFyZyA6IHJlc29sdmUocHJvY2Vzcy5jd2QoKSwgYXJnKTtcbiAgICAvLyBpZiAoIWV4aXN0c1N5bmMoY3dkKSkge1xuICAgIC8vICAgY29uc29sZS5lcnJvcihgRXJyb3IhIERpcmVjdG9yeSBvciBmaWxlIGRvZXMgbm90IGV4aXN0OiAke2N3ZH1gKTtcbiAgICAvLyAgIHByb2Nlc3MuZXhpdCgxKTtcbiAgICAvLyB9XG4gICAgcmV0dXJuIGFyZztcbiAgfSk7XG5cbiAgaWYgKCFmbGFncy52ZXJib3NlKSB7XG4gICAgb3B0aW9uc1snc3RkaW8nXSA9ICdpZ25vcmUnO1xuICAgIGlmIChwcm9jZXNzLnBsYXRmb3JtID09PSAnZGFyd2luJykge1xuICAgICAgLy9Vc2UgYG9wZW5gIHRvIHByZXZlbnQgbXVsdGlwbGUgJHthcHBOYW1lfSBwcm9jZXNzXG4gICAgICBjb25zdCBjbWQgPSBgb3BlbiAtYiBjby5zaGluaW5nLmFwcGJveCAtLWFyZ3MgJHthcmdzLnN1Yi5qb2luKCcgJyl9YDtcblx0XHRcdGNvbnNvbGUubG9nKCdhcmdzID09ICcsYXJncy5zdWIpO1xuICAgICAgY29uc3Qgb3B0cyA9IHtcbiAgICAgICAgZW52XG4gICAgICB9O1xuICAgICAgLy8gcmV0dXJuIGV4ZWMoY21kLCBvcHRzKTtcbiAgICAgICAgcmV0dXJuIHBpZnkoZXhlYykoY21kLCBvcHRzKTtcbiAgICB9XG4gIH1cblxuICBjb25zdCBjaGlsZCA9IHNwYXduKHByb2Nlc3MuZXhlY1BhdGgsIGFyZ3Muc3ViLCBvcHRpb25zKTtcblxuICBpZiAoZmxhZ3MudmVyYm9zZSkge1xuICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tdW5zYWZlLWNhbGxcbiAgICBjaGlsZC5zdGRvdXQ/Lm9uKCdkYXRhJywgKGRhdGE6YW55KSA9PiBjb25zb2xlLmxvZyhkYXRhLnRvU3RyaW5nKCd1dGY4JykpKTtcbiAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L25vLXVuc2FmZS1jYWxsXG4gICAgY2hpbGQuc3RkZXJyPy5vbignZGF0YScsIChkYXRhOmFueSkgPT4gY29uc29sZS5lcnJvcihkYXRhLnRvU3RyaW5nKCd1dGY4JykpKTtcbiAgfVxuICBpZiAoZmxhZ3MudmVyYm9zZSkge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgoYykgPT4gY2hpbGQub25jZSgnZXhpdCcsICgpID0+IGMobnVsbCkpKTtcbiAgfVxuICBjaGlsZC51bnJlZigpO1xuICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XG59O1xuXG5mdW5jdGlvbiBldmVudHVhbGx5RXhpdChjb2RlOm51bWJlcikge1xuICBzZXRUaW1lb3V0KCgpID0+IHByb2Nlc3MuZXhpdChjb2RlKSwgMTAwKTtcbn1cblxubWFpbihwcm9jZXNzLmFyZ3YpXG4gIC50aGVuKCgpID0+IGV2ZW50dWFsbHlFeGl0KDApKVxuICAuY2F0Y2goKGVycjphbnkpID0+IHtcbiAgICBjb25zb2xlLmVycm9yKGVyci5zdGFjayA/IGVyci5zdGFjayA6IGVycik7XG4gICAgZXZlbnR1YWxseUV4aXQoMSk7XG59KTtcbiJdLCJuYW1lcyI6W10sInNvdXJjZVJvb3QiOiIifQ==