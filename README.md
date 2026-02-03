# GrapesJS Script Editor with CodeMirror

Attach script to selected component with CodeMirror 6 integration.

This plugin adds the possibility to attach JavaScript code to any component with the powerful CodeMirror 6 editor, featuring the VS Code Dark theme.

## Features
- **Rich Syntax Highlighting** - JavaScript syntax highlighting with the VS Code theme.
- **Modern Editor** - Built on CodeMirror 6 for better performance and modularity.
- **VS Code Theme** - Premium look and feel with `@uiw/codemirror-theme-vscode`.
- **Advanced Editing** - Native CodeMirror 6 features including multi-cursor support and flexible configuration.
- **Lightweight** - Bundled CodeMirror is optimized for size and performance.

> Requires GrapesJS v0.14.25 or higher

## Quick Start

```javascript
grapesjs.init({
  container: '#gjs',
  plugins: ['sw-script-code-editor']
});
```

### JS
```js
const editor = grapesjs.init({
  container: '#gjs',
  height: '100%',
  fromElement: true,
  storageManager: false,
  plugins: ['sw-script-code-editor'],
  pluginsOpts: {
    'sw-script-code-editor': {
      // CodeMirror specific options
      codeMirrorOptions: {
        lineNumbers: true,
        tabSize: 2,
        // Add more CodeMirror extensions here
      }
    }
  }
});
```

## Options

| Option | Description | Default |
| - | - | - |
| `starter` | Starter code | `let el = this` |
| `toolbarIcon` | Toolbar icon for opening script modal | `<i class="fa fa-file-code-o"></i>` | 
| `scriptTypesSupport` | Component types to allow script editing | `['default', 'wrapper', 'text', 'textnode', 'image', 'video', 'svg']` |
| `toolbarBtnCustomScript` | Options to pass when extending toolbar | `{}` |
| `onRun` | Logic to run if debug is successful | `() => console.log('valid syntax')` |
| `onError` | Logic to run if debug finds errors | `err => console.log('error:',err)` |
| `modalTitle` | Title for script modal | `Script` |
| `codeMirrorOptions` | CodeMirror 6 specific options | `{ lineNumbers: true, tabSize: 2 }` |
| `buttonLabel` | Label for the default save button | `Save` |
| `commandAttachScript` | Object to extend the default `edit-script` command | `{}` |

## Development

### Build
```bash
npm run build
```

### Start Development Server
```bash
npm start
```
