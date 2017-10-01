"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
require("codemirror-graphql/hint");
require("codemirror-graphql/info");
require("codemirror-graphql/jump");
require("codemirror-graphql/lint");
require("codemirror-graphql/mode");
require("codemirror/addon/comment/comment");
require("codemirror/addon/edit/closebrackets");
require("codemirror/addon/edit/matchbrackets");
require("codemirror/addon/fold/brace-fold");
require("codemirror/addon/fold/foldgutter");
require("codemirror/addon/hint/show-hint");
require("codemirror/addon/lint/lint");
require("codemirror/keymap/sublime");
require("codemirror/keymap/sublime");
var CodeMirror = require("codemirror");
var graphql_1 = require("graphql");
var marked_1 = require("marked");
var React = require("react");
var GraphQLEditor = /** @class */ (function (_super) {
    __extends(GraphQLEditor, _super);
    function GraphQLEditor(props) {
        var _this = _super.call(this, props) || this;
        _this.cachedValue = props.value;
        _this._schema = null;
        _this.ignoreChangeEvent = false;
        return _this;
    }
    GraphQLEditor.prototype.tryBuildSchema = function (schemaIDL, extensionIDL) {
        // TODO: add throttling
        try {
            this._schema = graphql_1.buildSchema(schemaIDL);
            if (extensionIDL)
                this._schema = graphql_1.extendSchema(this._schema, graphql_1.parse(extensionIDL));
        }
        catch (e) {
            // skip error here
        }
    };
    Object.defineProperty(GraphQLEditor.prototype, "schema", {
        get: function () {
            var schemaIDL, extensionIDL;
            if (this.props.extendMode) {
                schemaIDL = this.props.schemaPrefix;
                extensionIDL = this.props.value;
            }
            else {
                schemaIDL = this.props.schemaPrefix + this.props.value;
            }
            this.tryBuildSchema(schemaIDL, extensionIDL);
            return this._schema;
        },
        enumerable: true,
        configurable: true
    });
    GraphQLEditor.prototype.componentDidMount = function () {
        var _this = this;
        var editor = CodeMirror(this._node, {
            value: this.props.value || '',
            lineNumbers: true,
            tabSize: 2,
            mode: 'graphql',
            theme: 'graphiql',
            keyMap: 'sublime',
            autoCloseBrackets: true,
            matchBrackets: true,
            showCursorWhenSelecting: true,
            foldGutter: {
                minFoldSize: 4,
            },
            lint: {
                schema: this.schema,
            },
            hintOptions: {
                schema: this.schema,
                closeOnUnfocus: false,
                completeSingle: false,
            },
            info: {
                schema: this.schema,
                renderDescription: function (text) { return marked_1.default(text, { sanitize: true }); },
            },
            jump: {
                schema: this.schema,
            },
            gutters: ['CodeMirror-linenumbers', 'CodeMirror-foldgutter'],
            extraKeys: {
                'Cmd-Space': function () { return editor.showHint({ completeSingle: true }); },
                'Ctrl-Space': function () { return editor.showHint({ completeSingle: true }); },
                'Alt-Space': function () { return editor.showHint({ completeSingle: true }); },
                'Shift-Space': function () { return editor.showHint({ completeSingle: true }); },
                'Cmd-Enter': function () {
                    if (_this.props.onCommand) {
                        _this.props.onCommand();
                    }
                },
                'Ctrl-Enter': function () {
                    if (_this.props.onCommand) {
                        _this.props.onCommand();
                    }
                },
                // Editor improvements
                'Ctrl-Left': 'goSubwordLeft',
                'Ctrl-Right': 'goSubwordRight',
                'Alt-Left': 'goGroupLeft',
                'Alt-Right': 'goGroupRight',
            },
        });
        editor.on('change', this._onEdit.bind(this));
        editor.on('keyup', this._onKeyUp.bind(this));
        editor.on('hasCompletion', this._onHasCompletion.bind(this));
        this.editor = editor;
    };
    GraphQLEditor.prototype.render = function () {
        var _this = this;
        return (React.createElement("div", { className: "graphql-editor", ref: function (node) {
                _this._node = node;
            } }));
    };
    GraphQLEditor.prototype.componentDidUpdate = function (prevProps) {
        // Ensure the changes caused by this update are not interpretted as
        // user-input changes which could otherwise result in an infinite
        // event loop.
        this.ignoreChangeEvent = true;
        if (this.props.value !== prevProps.value &&
            this.props.value !== this.cachedValue) {
            if (this.props.value !== this.cachedValue) {
                this.cachedValue = this.props.value;
                this.editor.setValue(this.props.value);
            }
            this.updateSchema();
        }
        this.ignoreChangeEvent = false;
    };
    GraphQLEditor.prototype.updateSchema = function () {
        this.editor.options.lint.schema = this.schema;
        this.editor.options.hintOptions.schema = this.schema;
        this.editor.options.info.schema = this.schema;
        this.editor.options.jump.schema = this.schema;
        CodeMirror.signal(this.editor, 'change', this.editor);
    };
    GraphQLEditor.prototype.componentWillUnmount = function () {
        this.editor.off('change', this._onEdit);
        this.editor.off('keyup', this._onKeyUp);
        this.editor.off('hasCompletion', this._onHasCompletion);
        this.editor = null;
    };
    GraphQLEditor.prototype._onKeyUp = function (cm, event) {
        var code = event.keyCode;
        if ((code >= 65 && code <= 90) || // letters
            (!event.shiftKey && code >= 48 && code <= 57) || // numbers
            (event.shiftKey && code === 189) || // underscore
            (event.shiftKey && code === 50) || // @
            (event.shiftKey && code === 57) || // (
            (event.shiftKey && code === 186) // :
        ) {
            this.editor.execCommand('autocomplete');
        }
    };
    GraphQLEditor.prototype._onEdit = function () {
        if (!this.ignoreChangeEvent) {
            this.cachedValue = this.editor.getValue();
            if (this.props.onEdit) {
                this.props.onEdit(this.cachedValue);
            }
        }
    };
    /**
     * Render a custom UI for CodeMirror's hint which includes additional info
     * about the type and description for the selected context.
     */
    GraphQLEditor.prototype._onHasCompletion = function (cm, data) {
        onHasCompletion(cm, data);
    };
    return GraphQLEditor;
}(React.Component));
exports.default = GraphQLEditor;
/**
 * Render a custom UI for CodeMirror's hint which includes additional info
 * about the type and description for the selected context.
 */
function onHasCompletion(cm, data, onHintInformationRender) {
    var information;
    var deprecation;
    // When a hint result is selected, we augment the UI with information.
    CodeMirror.on(data, 'select', function (ctx, el) {
        // Only the first time (usually when the hint UI is first displayed)
        // do we create the information nodes.
        if (!information) {
            var hintsUl_1 = el.parentNode;
            // This "information" node will contain the additional info about the
            // highlighted typeahead option.
            information = document.createElement('div');
            information.className = 'CodeMirror-hint-information';
            hintsUl_1.appendChild(information);
            // This "deprecation" node will contain info about deprecated usage.
            deprecation = document.createElement('div');
            deprecation.className = 'CodeMirror-hint-deprecation';
            hintsUl_1.appendChild(deprecation);
            // When CodeMirror attempts to remove the hint UI, we detect that it was
            // removed and in turn remove the information nodes.
            var onRemoveFn_1;
            hintsUl_1.addEventListener('DOMNodeRemoved', (onRemoveFn_1 = function (event) {
                if (event.target === hintsUl_1) {
                    hintsUl_1.removeEventListener('DOMNodeRemoved', onRemoveFn_1);
                    information = null;
                    deprecation = null;
                    onRemoveFn_1 = null;
                }
            }));
        }
        // Now that the UI has been set up, add info to information.
        var description = ctx.description
            ? marked_1.default(ctx.description, { sanitize: true })
            : 'Self descriptive.';
        var type = ctx.type
            ? '<span class="infoType">' + renderType(ctx.type) + '</span>'
            : '';
        information.innerHTML =
            '<div class="content">' +
                (description.slice(0, 3) === '<p>'
                    ? '<p>' + type + description.slice(3)
                    : type + description) +
                '</div>';
        if (ctx.isDeprecated) {
            var reason = ctx.deprecationReason
                ? marked_1.default(ctx.deprecationReason, { sanitize: true })
                : '';
            deprecation.innerHTML =
                '<span class="deprecation-label">Deprecated</span>' + reason;
            deprecation.style.display = 'block';
        }
        else {
            deprecation.style.display = 'none';
        }
        // Additional rendering?
        if (onHintInformationRender) {
            onHintInformationRender(information);
        }
    });
}
function renderType(type) {
    if (type instanceof graphql_1.GraphQLNonNull) {
        return renderType(type.ofType) + "!";
    }
    if (type instanceof graphql_1.GraphQLList) {
        return "[" + renderType(type.ofType) + "]";
    }
    return "<a class=\"typeName\">" + type.name + "</a>";
}
//# sourceMappingURL=GraphQLEditor.js.map