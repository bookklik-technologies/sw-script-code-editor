import { cmdId } from './consts';
import { EditorView, basicSetup } from 'codemirror';
import { EditorState } from '@codemirror/state';
import { javascript } from '@codemirror/lang-javascript';
import { vscodeDark } from '@uiw/codemirror-theme-vscode';

export interface PluginOptions {
  starter?: string;
  toolbarIcon?: string;
  scriptTypesSupport?: string[] | string;
  toolbarBtnCustomScript?: Record<string, any>;
  onRun?: () => void;
  onError?: (error: Error) => void;
  modalTitle?: string;
  codeLabel?: string;
  codeMirrorOptions?: Record<string, any>;
  buttonLabel?: string;
  commandAttachScript?: Record<string, any>;
}

export default (editor: any, opts: PluginOptions = {}) => {
  const cm = editor.Commands;
  const md = editor.Modal;
  const domc = editor.Components;
  const {
    modalTitle = 'Script',
    codeMirrorOptions = {},
    commandAttachScript = {},
    toolbarIcon = '<i class="fa fa-file-code-o"></i>',
    onRun = () => console.log('valid syntax'),
    onError = (err: Error) => console.log('error', err),
    starter = 'let el = this',
    buttonLabel = 'Save'
  } = opts;

  let scriptTypesSupport = opts.scriptTypesSupport;
  let content: HTMLElement | null = null;

  const appendToContent = (target: HTMLElement, content: any) => {
    if (content instanceof HTMLElement) {
      target.appendChild(content);
    } else if (content) {
      target.insertAdjacentHTML('beforeend', content);
    }
  };

  if (editor.$.isString(scriptTypesSupport)) {
    scriptTypesSupport = (scriptTypesSupport as string).split(',');
  }

  if (editor.$.isArray(scriptTypesSupport)) {
    scriptTypesSupport = (scriptTypesSupport as string[]).includes('*') ?
      domc.getTypes().map((c: any) => c.id) : scriptTypesSupport;
  }

  // Add icons to specified component types
  scriptTypesSupport && (scriptTypesSupport as string[]).forEach((type: string) => {
    const typeOpt = domc.getType(type).model;
    domc.addType(type, {
      model: {
        initToolbar(this: any) {
          typeOpt.prototype.initToolbar.apply(this, arguments);
          const tb = this.get('toolbar');
          const tbExists = tb.some((item: any) => item.command === cmdId);

          if (!tbExists) {
            tb.unshift({
              command: cmdId,
              label: toolbarIcon,
              ...opts.toolbarBtnCustomScript
            });
            this.set('toolbar', tb);
          }
        }
      }
    });
  });

  // Add the script command
  cm.add(cmdId, {
    editor: null as any,
    options: {} as any,
    target: null as any,
    codeViewer: null as any,

    run(editor: any, sender: any, opts: any = {}) {
      this.editor = editor;
      this.options = opts;
      this.target = opts.target || editor.getSelected();
      const target = this.target;

      if (target) this.showCustomCode(target);
    },

    stop(editor: any) {
      // Clean up CodeMirror instance
      if (this.codeViewer && this.codeViewer.dispose) {
        this.codeViewer.dispose();
        this.codeViewer = null;
      }
      content = null;
      md.close();
    },

    /**
     * Method which tells how to show the custom code
     */
    async showCustomCode(target: any) {
      const { editor, options } = this;
      const title = options.title || modalTitle;
      
      content = this.getContent();
      let code = target.getScriptString() || starter;
      
      // Open modal first
      const modal = md.open({
        title,
        content
      });
      
      // Set up close handler
      modal.getModel().once('change:open', () => editor.stopCommand(this.id));
      
      // Initialize CodeMirror after modal is open
      setTimeout(() => {
        const codeViewer = this.getCodeViewer();
        if (codeViewer) {
          codeViewer.setContent(code);
          codeViewer.focus();
        }
      }, 0);
    },

    /**
     * Custom pre-content. Can be a simple string or an HTMLElement
     */
    getPreContent() {},

    /**
     * Custom post-content. Can be a simple string or an HTMLElement
     */
    getPostContent() {},

    /**
     * Get all the content for the custom code
     */
    getContent(): HTMLElement {
      const { editor } = this;
      const content = document.createElement('div');
      const pfx = editor.getConfig('stylePrefix');
      content.className = `${pfx}attach-script sw-script-editor`;
      
      // Add Editor styles
      if (!document.getElementById('sw-script-editor-styles')) {
        const style = document.createElement('style');
        style.id = 'sw-script-editor-styles';
        style.textContent = `
          .sw-script-editor {
            display: flex;
            flex-direction: column;
            height: 500px;
          }
          .cm-editor-container {
            flex: 1;
            min-height: 400px;
            border: 1px solid rgba(0,0,0,0.2);
            border-radius: 3px;
            overflow: hidden;
          }
          .cm-editor {
            height: 100%;
          }
        `;
        document.head.appendChild(style);
      }
      
      appendToContent(content, this.getPreContent());
      const codeViewer = this.getCodeViewer();
      content.appendChild(codeViewer.getElement());
      appendToContent(content, this.getPostContent());
      appendToContent(content, this.getContentActions());

      return content;
    },

    /**
     * Get the actions content
     */
    getContentActions(): HTMLElement {
      const { editor } = this;
      const actions = document.createElement('div');
      actions.id = "actns";
      actions.style.display = "flex";
      actions.style.justifyContent = "space-between";
      actions.style.marginTop = "16px";
      
      const btn = document.createElement('button');
      const pfx = editor.getConfig('stylePrefix');
      btn.innerHTML = buttonLabel;
      btn.className = `${pfx}btn-prim ${pfx}btn-save__inject-logic`;
      btn.onclick = () => this.handleSave();

      const runLogic = document.createElement('div');
      runLogic.id = "logic-toolbar";
      runLogic.className = "fa fa-bug";
      runLogic.style.cssText = "padding:10px;background:rgba(0,0,0,0.2);border-radius:3px;border:1px solid rgba(0,0,0,0.2);cursor:pointer";
      runLogic.onclick = () => this.runCode();

      actions.appendChild(runLogic);
      actions.appendChild(btn);

      return actions;
    },

    /**
     * Handle the main save task
     */
    handleSave() {
      const { editor, target } = this;
      const code = this.getCodeViewer().getContent();
      target.set('script', code);
      editor.Modal.close();
    },

    /**
     * Return the CodeMirror instance
     */
    getCodeViewer() {
      if (!this.codeViewer) {
        const container = document.createElement('div');
        container.className = 'cm-editor-container';
        
        // Initialize CodeMirror 6
        const view = new EditorView({
          state: undefined, // Will be set in setContent
          parent: container,
        });

        this.codeViewer = {
          getElement: () => container,
          setContent: (code: string) => {
            const state = EditorState.create({
              doc: code || '',
              extensions: [
                basicSetup,
                javascript(),
                vscodeDark,
                ...((codeMirrorOptions as any).extensions || [])
              ],
            });
            view.setState(state);
          },
          getContent: () => view.state.doc.toString(),
          focus: () => view.focus(),
          dispose: () => view.destroy()
        };
      }

      return this.codeViewer;
    },

    /**
     * Evaluate code syntax
     */
    runCode() {
      try {
        const code = this.getCodeViewer().getContent();
        
        if (!code || code.trim().length === 0) {
          throw new Error('Code is empty. Please write some JavaScript code.');
        }
        
        // Test code execution in a safe context
        try {
          new Function('"use strict";\n' + code);
          alert('No syntax errors detected.');
        } catch (syntaxError: any) {
          throw new Error(`Syntax Error: ${syntaxError.message}`);
        }
        
        onRun && onRun();
      } catch (err: any) {
        console.error("Script validation error:", err);
        onError && onError(err);
        alert(err.message);
      }
    },

    ...commandAttachScript,
  });
};
