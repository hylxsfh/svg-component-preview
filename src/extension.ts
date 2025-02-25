import * as vscode from 'vscode';
//TODO 上传github
let decorations: vscode.TextEditorDecorationType[] = [];

export function activate (context: vscode.ExtensionContext) {
    // 监听编辑器变化并更新装饰器
    vscode.window.onDidChangeActiveTextEditor(updateDecorations, null, context.subscriptions);
    updateDecorations(vscode.window.activeTextEditor);

    // 监听文件保存事件并更新装饰器
    vscode.workspace.onDidSaveTextDocument((document) => {
        const editor = vscode.window.activeTextEditor;
        if (editor && editor.document === document) {
            updateDecorations(editor);
        }
    }, null, context.subscriptions);

    //更新默认打开的编辑器的装饰器
    const editor = vscode.window.activeTextEditor;
    if (editor) {
        updateDecorations(editor);
    }

}

// 更新装饰器
function updateDecorations (editor?: vscode.TextEditor) {
    if (!editor) return;

    // 检查文件类型是否为jsx或tsx
    const document = editor.document;
    if (!document.fileName.endsWith('.jsx') && !document.fileName.endsWith('.tsx')
        && !document.fileName.endsWith('.vue')) {
        return;
    }

    // 清除所有现有的装饰器
    decorations.map(decoration => {
        decoration.dispose()
        editor.setDecorations(decoration, []);
    });
    decorations = [];

    // 查找SVG标签
    const text = document.getText();
    const svgRegex = /<svg\b[^>]*>([\s\S]*?)<\/svg>/gi;
    let match;

    while ((match = svgRegex.exec(text)) !== null) {
        const startPos = document.positionAt(match.index);
        let svgContent = match[0];

        // 提取 fill 和 viewBox 属性
        const fillMatch = svgContent.match(/ fill="([^"]*)"/);
        const viewBoxMatch = svgContent.match(/ viewBox="([^"]*)"/);
        const xmlnsMatch = svgContent.match(/ xmlns="([^"]*)"/);

        const fill = fillMatch ? ` fill="${fillMatch[1]}"` : '';
        const viewBox = viewBoxMatch ? ` viewBox="${viewBoxMatch[1]}"` : '';
        const xmlns = xmlnsMatch ? ` xmlns="${xmlnsMatch[1]}"` : '';

        // 重新组装 SVG 开始标签
        const newSvgStartTag = `<svg${fill}${viewBox}${xmlns}>`;
        const svgEndTag = '</svg>';
        const svgContentWithoutClass = newSvgStartTag + svgContent.slice(svgContent.indexOf('>') + 1, svgContent.lastIndexOf('</svg>')) + svgEndTag;
        const encodedSVG = encodeURIComponent(svgContentWithoutClass.replace(/\s+/g, ' ')); // 压缩空格
        const dataUrl = `data:image/svg+xml;charset=utf-8,${encodedSVG}`;

        // 创建一个唯一的图标路径，这里使用SVG内容的哈希值
        const iconPath = vscode.Uri.parse(dataUrl);

        // 创建动态的TextEditorDecorationType
        const decorationType = vscode.window.createTextEditorDecorationType({
            gutterIconPath: iconPath,
            gutterIconSize: 'contain'
        });
        decorations.push(decorationType);

        // 应用装饰器
        editor.setDecorations(decorationType, [{
            range: new vscode.Range(startPos.line, 0, startPos.line, 0),
            hoverMessage: 'SVG Tag',
        }]);
    }
}

/**
 * 清除编辑器装饰器
 * @param editor 
 * @param decorations 
 */
function clearEditorDecorations (editor: vscode.TextEditor, decorations: vscode.TextEditorDecorationType[]) {
    if (editor) {
        decorations.forEach((decoration) => {
            decoration.dispose();
            editor.setDecorations(decoration, [])
        });
    }
};

export function deactivate () { }

