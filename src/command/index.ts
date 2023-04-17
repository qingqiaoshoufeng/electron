// This is a CLI tool, using console is OK
/* eslint no-console: 0 */
import {spawn, exec} from 'child_process';
const { app } = require('electron');
import pify from 'pify';
import args from 'args';
import path from 'path';
import  fs  from 'fs-extra';
import cmd from 'node-cmd';


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



args.command('<default>', `Launch ${appName}`);

args.option(['v', 'verbose'], 'Verbose mode', false);

args.command(
  'version',
  `Show the version of ${appName}`,
  () => {
    const packageJson = fs.readJSONSync(path.join(__dirname, '../../package.json'));
    console.log('主项目名称 == ',packageJson.version);
    console.log(1.0);
    process.exit(0);
  },
  []
);

args.command(
  'open',
  'Open related software',
  (name:string, args_:any)=>{
    if (process.platform === 'darwin') {
			const apppath = '/Applications/DingTalk.app';
			console.log('args_join == ',args_.join(' '))
			const script = `open ${apppath}`;
      cmd.runSync(script);
		}else{
			console.log(`name=${name} args=${args_}`);
		}
    process.exit(0);
  }
);


const main = (argv:any) => {
  const flags = args.parse(argv, {
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

  const args_ = args.sub.map((arg:any) => {
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
      const cmd = `open -b co.shining.appbox --args ${args.sub.join(' ')}`;
			console.log('args == ',args.sub);
      const opts = {
        env
      };
      // return exec(cmd, opts);
        return pify(exec)(cmd, opts);
    }
  }

  const child = spawn(process.execPath, args.sub, options);

  if (flags.verbose) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    child.stdout?.on('data', (data:any) => console.log(data.toString('utf8')));
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    child.stderr?.on('data', (data:any) => console.error(data.toString('utf8')));
  }
  if (flags.verbose) {
    return new Promise((c) => child.once('exit', () => c(null)));
  }
  child.unref();
  return Promise.resolve();
};

function eventuallyExit(code:number) {
  setTimeout(() => process.exit(code), 100);
}

main(process.argv)
  .then(() => eventuallyExit(0))
  .catch((err:any) => {
    console.error(err.stack ? err.stack : err);
    eventuallyExit(1);
});
