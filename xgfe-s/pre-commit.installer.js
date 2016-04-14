var fs = require('fs');
var hookType = 'pre-commit',
    hookPath='.git/hooks/'+hookType,
    hookContents='var child_process = require(\'child_process\');\nvar execSync = child_process.execSync;\nvar spawnSync = child_process.spawnSync;\nvar path = require(\'path\');\n\nvar files = getDiffFiles();\nif(!files.length){\n    quit();\n}\nvar libFiles = files.filter(function (file) {\n    return isLibFiles(file.subpath) && ~[\'d\',\'m\',\'c\',\'r\'].indexOf(file.status);\n});\nif(libFiles.length){\n    console.log(\'[WARNING] You cannot delete/modify/copy/rename any file in lib directory！！\\n\' +\n        \'Listed below are thus files:\');\n    var libFilePaths = libFiles.map(function (file) {\n        return file.subpath;\n    }).join(\'\\n\');\n    console.log(libFilePaths+\'\\n\');\n    quit(1);\n}\n// 待检查的文件相对路径\nvar lintFiles = files.filter(function (file) {\n    return !isLibFiles(file.subpath)\n        && !isDistFiles(file.subpath)\n        && ~[\'a\',\'m\',\'c\',\'r\'].indexOf(file.status)\n        && !isXChartsFiles(file.subpath);\n}).map(function (file) {\n    return file.subpath;\n});\nvar argv = [\'lint\'];\nargv = argv.concat(lintFiles);\nargv = argv.concat([\'-c\',\'src/.lintrc\']);\nvar result = spawnSync(\'xg\',argv);\nif (result.stdout.length) {\n    console.log(result.stdout.toString());\n}\nif(result.stderr.length){\n    console.error(result.stderr.toString());\n}\nquit(result.status);\n\n/**\n * 获取所有变动的文件,包括增(A)删(D)改(M)重命名(R)复制(C)等\n * @param [type] {string} - 文件变动类型\n * @returns {Array}\n */\nfunction getDiffFiles(type) {\n    var DIFF_COMMAND = \'git diff --cached --name-status HEAD\';\n    var root = process.cwd();\n    var files = execSync(DIFF_COMMAND).toString().split(\'\\n\');\n    var result = [];\n    type = type || \'admrc\';\n    var types = type.split(\'\').map(function (t) {\n        return t.toLowerCase();\n    });\n    files.forEach(function (file) {\n        if(!file){\n            return;\n        }\n        var temp = file.split(/[\\n\\t]/);\n        var status = temp[0].toLowerCase();\n        var filepath = root+\'/\'+temp[1];\n        var extName = path.extname(filepath).slice(1);\n\n        if(types.length && ~types.indexOf(status)){\n            result.push({\n                status:status, // 文件变更状态-AMDRC\n                path:filepath, // 文件绝对路径\n                subpath:temp[1], // 文件相对路径\n                extName:extName // 文件后缀名\n            });\n        }\n    });\n    return result;\n}\n/**\n * 是否是lib目录下的文件,xCharts除外\n */\nfunction isLibFiles(subpath){\n    return subpath.match(/^src\\/lib\\/.*/i)\n        && !subpath.match(/^src\\/lib\\/xCharts\\/.*/i);\n}\n/**\n * 是否是xCharts目录下的文件\n */\nfunction isXChartsFiles(subpath) {\n    return subpath.match(/^src\\/lib\\/xCharts\\/.*/i);\n}\n/**\n * 是否是dist目录下的文件\n */\nfunction isDistFiles(subpath){\n    return subpath.match(/^dist\\/.*/i);\n}\n/**\n * 退出\n * @param errorCode\n */\nfunction quit(errorCode) {\n    if (errorCode) {\n        console.log(\'Commit aborted.\');\n    }\n    process.exit(errorCode || 0);\n}\n';

hookContents = '#!/usr/bin/env node\n\n'+hookContents;
fs.writeFile(hookPath,hookContents,{
    mode:'0755'
}, function (err) {
    if(err){
        return console.log('[ERROR]:%s',err);
    }
    console.log('[INFO]:'+hookType+' installed successfully.');
});
