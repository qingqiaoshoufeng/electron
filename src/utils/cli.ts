
import fs from 'fs-extra';
import path from 'path';
import notify from './logger'
import sudoPrompt from 'sudo-prompt'
import cmd from 'node-cmd';
import { clipboard, dialog, app } from 'electron'
import copydir from 'copy-dir';


const appCliName = 'doctordesk';
const Registry = require('native-reg')

let cliScriptPath = path.join(__dirname, `../../bin/${appCliName}`);
if (!app.isPackaged) {
    cliScriptPath = process.platform == 'win32' ? path.join(__dirname, `../bin/win/${appCliName}`) : path.join(__dirname, `../bin/${appCliName}`);
}
notify.front(`cliScriptPath = ${cliScriptPath}`);

const cliLinkPath = `/usr/local/bin/${appCliName}`;


const checkInstall = () => {
    try {
        let link = fs.readlinkSync(cliLinkPath);
        return link === cliScriptPath;
    } catch (error) {
        return false;
    }
};
const addSymlink = async (silent: boolean) => {
    try {
        const isInstalled = checkInstall();
        if (isInstalled) {
            console.log(`${appCliName} CLI already in PATH`);
            return;
        }


        if (!fs.existsSync(path.dirname(cliLinkPath))) {
            try {
                fs.mkdirpSync(path.dirname(cliLinkPath));
            }
            catch (err) {
                throw `Failed to create directory ${path.dirname(cliLinkPath)} - ${err}`;
            }
        }

        console.log('path.dirname(cliLinkPath) == ', cliScriptPath)
        fs.symlinkSync(cliScriptPath, cliLinkPath);
    }
    catch (_err) {
        const err: any = _err;
        // 'EINVAL' is returned by readlink,
        // 'EEXIST' is returned by symlink
        let error = err.code === 'EEXIST' || err.code === 'EINVAL'
            ? `File already exists: ${cliLinkPath}`
            : `Symlink creation failed: ${err.code}`;
        // Need sudo access to create symlink
        console.log('您的权限不足', err.code);
        if (err.code === 'EACCES' && !silent) {
          const result = await dialog.showMessageBox({
            message: `需要授予更高的权限将去将${appCliName}添加到环境变量中`,
            type: 'info',
            buttons: ['OK', 'Cancel']
          });
            // const result = await dialog.showMessageBox({
            //     message: `需要授予更高的权限将去将${appCliName}添加到环境变量中或者您可以直接在命令行运行
						// 		sudo ln -sf "${cliScriptPath}" "${cliLinkPath}"`,
            //     type: 'info',
            //     buttons: ['OK', 'Copy Command', 'Cancel']
            // });
            if (result.response === 0) {
                try {
                    sudoPrompt.exec(`ln -sf "${cliScriptPath}" "${cliLinkPath}"`, { name: `${appCliName}` });
                    // await sudoExec(`ln -sf "${cliScriptPath}" "${cliLinkPath}"`, { name: `${appCliName}` });
                    return;
                }
                catch (_error: any) {
                    error = _error[0];
                }
            }
            else if (result.response === 1) {
                clipboard.writeText(`sudo ln -sf "${cliScriptPath}" "${cliLinkPath}"`);
            }else{
              app.quit()
            }
        }
        throw error;
    }
};
const addBinToUserPath = () => {
    return new Promise((resolve, reject) => {
        try {
            notify.front(`开始写入注册表`);
            //添加app唤起协议
            if (!app.isDefaultProtocolClient(`${appCliName}`)) {
                app.setAsDefaultProtocolClient(`${appCliName}`)
            }
            const envKey = Registry.openKey(Registry.HKCU, 'Environment', Registry.Access.ALL_ACCESS);
            if (!envKey) return;
            const binPath = path.dirname(cliScriptPath);
            const oldPath = path.resolve(process.env.LOCALAPPDATA ?? '', `${appCliName}`);
            const items = Registry.enumValueNames(envKey);
            const pathItem = items.find((item: string) => item.toUpperCase() === 'PATH');
            const pathItemName = pathItem || 'PATH';
            let newPathValue = binPath;
            let type = Registry.ValueType.SZ;
            if (pathItem) {
                type = Registry.queryValueRaw(envKey, pathItem)?.type ?? Registry.ValueType.SZ;
                if (type !== Registry.ValueType.SZ && type !== Registry.ValueType.EXPAND_SZ) {
                    reject(`Registry key type is ${type}`);
                    return;
                }
                const value = Registry.queryValue(envKey, pathItem) ?? '';
                let pathParts = value.split(';');
                const existingPath = pathParts.includes(binPath);
                const existingOldPath = pathParts.some((pathPart: string) => pathPart.startsWith(oldPath));
                if (existingPath && !existingOldPath) {
                    console.log(`${appCliName} CLI already in PATH`);
                    Registry.closeKey(envKey);
                    return resolve('');
                }
                // Because nsis install path is different from squirrel we need to remove old path if present
                // and add current path if absent
                if (existingOldPath)
                    pathParts = pathParts.filter((pathPart: string) => !pathPart.startsWith(oldPath));
                if (!pathParts.includes(binPath))
                    pathParts.push(binPath);
                newPathValue = pathParts.join(';');
            }
            notify.front(`Adding ${appCliName}CLI path (registry)`);
            console.log(`Adding ${appCliName}CLI path (registry)`);
            Registry.setValueRaw(envKey, pathItemName, type, Registry.formatString(newPathValue));
            Registry.closeKey(envKey);
            resolve('');
        }
        catch (error) {
            reject(error);
        }
    });
};
const logNotify = (withNotification: boolean, title: string, body: string, details = '') => {
    console.log(title, body, details || '');
    withNotification && notify.system(title + body + details || '');
};


//安装choco到windows环境
const installChocolateyToSystem = () => {
    const chocoInfo=    cmd.runSync(`choco -v`);
    if(!chocoInfo.data){
        notify.front(`choco is not exist`);

        let chocoBinFolderPath = path.join(__dirname, `../../bin/choco`);

        if (!app.isPackaged) {
            chocoBinFolderPath = path.join(__dirname, `../bin/win/choco`);
        }

        const chocoFolderPath =  path.join(process.env.SystemDrive || "C:", `choco`);
        notify.front(`choco安装文件所在：${chocoFolderPath}`)
        const chocoPath = path.join(chocoFolderPath, `setup.ps1`);
        if (!fs.existsSync(chocoPath)) {
            notify.front(`文件不存在，开始复制`);
            notify.front(`tempPath == ${chocoFolderPath}`);

            copydir.sync(chocoBinFolderPath, `${chocoFolderPath}`, {
                utimes: true,
                mode: true,
                cover: true,
            });
        }else{
          notify.front(`文件已存在，无需再复制`)
        }

        notify.front(`chocoPath = ${chocoPath}`);
        sudoPrompt.exec(`powershell.exe chcp 65001;set-ExecutionPolicy RemoteSigned;iex '${chocoPath}'`, { name: `${appCliName}`});
        // cmd.run(`powershell -noprofile -command "&{ start-process powershell -ArgumentList '-noprofile -file ${chocoPath}' -verb RunAs}"`)

    }else{
        notify.front(`choco already exist`);
    }
    setSoftwareInfoToSystemEnv()
}
//将软件信息写入系统环境变�?
const setSoftwareInfoToSystemEnv = () => {
    const name = app.getName()
    const version = app.getVersion();
    let softwarePath = '';
    let uninstallPath = '';
    if(app.isPackaged){
        softwarePath = path.join(`${process.resourcesPath}` , `../${name}.exe`);
        uninstallPath = path.join(`${process.resourcesPath}` , `../Uninstall ${name}.exe`);
    }

    const infoCmdStr = `setx ${name} "{'${version}':'${name}${version}'}" /m`;
    const detailCmdStr = `cmd.exe /c setx ${name}${version} "{'uninstall':'${uninstallPath}','main':'${softwarePath}'}" /m`;
    cmd.run(infoCmdStr)
    cmd.run(detailCmdStr)
}



const installCLI = async (withNotification: boolean) => {
    console.log(`appName == ${app.getName()}`)
    if (process.platform === 'win32') {
        notify.front(`开始进行注册表写入`);
        try {
            await addBinToUserPath();
            logNotify(withNotification, `${appCliName} CLI installed`, `You may need to restart your computer to complete this installation process.`);
        }
        catch (err) {
            logNotify(withNotification, `${appCliName} CLI installation failed`, `Failed to add ${appCliName} CLI path to user PATH ${err}`);
        }
        installChocolateyToSystem();
    } else if (process.platform === 'darwin' || process.platform === 'linux') {
        // AppImages are mounted on run at a temporary path, don't create symlink
        if (process.env['APPIMAGE']) {
            console.log('Skipping CLI symlink creation as it is an AppImage install');
            return;
        }
        try {
            await addSymlink(!withNotification);
            logNotify(withNotification, `${appCliName} CLI installed`, `Symlink created at ${cliLinkPath}`);
        }
        catch (error) {
            logNotify(withNotification, `${appCliName} CLI installation failed`, `${error}`);
        }
    }
    else {
        logNotify(withNotification, `${appCliName} CLI installation failed`, `Unsupported platform ${process.platform}`);
    }
};


export default installCLI;
// export = { installCLI }

