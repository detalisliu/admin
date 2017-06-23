/**
 * Created by Zhou on 17/2/9.
 */
define(function (require, exports, module) {

    const Vue = require('vue');
    const Clickoutside = require('../../../src/utils/clickoutside');
    const formatDate = require('./util/index').formatDate;
    const parseDate = require('./util/index').parseDate;

    const getWeekNumber = require('./util/index').getWeekNumber;
    const equalDate = require('./util/index').equalDate;
    const isDate = require('./util/index').isDate;

    const Popper = require('../../../src/utils/vue-popper');
    const Emitter = require('../../../src/mixins/emitter');
    const ElInput = require('../../input/index');

    const NewPopper = {
        props: {
            appendToBody: Popper.props.appendToBody,
            offset: Popper.props.offset,
            boundariesPadding: Popper.props.boundariesPadding
        },
        methods: Popper.methods,
        data: Popper.data,
        beforeDestroy: Popper.beforeDestroy
    };

    let RANGE_SEPARATOR = ' - ';
    const DEFAULT_FORMATS = {
        date: 'yyyy-MM-dd',
        month: 'yyyy-MM',
        datetime: 'yyyy-MM-dd HH:mm:ss',
        time: 'HH:mm:ss',
        timerange: 'HH:mm:ss',
        daterange: 'yyyy-MM-dd',
        datetimerange: 'yyyy-MM-dd HH:mm:ss',
        year: 'yyyy'
    };
    const HAVE_TRIGGER_TYPES = [
        'date',
        'datetime',
        'time',
        'time-select',
        'week',
        'month',
        'year',
        'daterange',
        'timerange',
        'datetimerange'
    ];
    const DATE_FORMATTER = function (value, format) {
        return formatDate(value, format);
    };
    const DATE_PARSER = function (text, format) {
        return parseDate(text, format);
    };
    const RANGE_FORMATTER = function (value, format) {
        if (Array.isArray(value) && value.length === 2) {
            const start = value[0];
            const end = value[1];

            if (start && end) {
                return formatDate(start, format) + RANGE_SEPARATOR + formatDate(end, format);
            }
        }
        return '';
    };
    const RANGE_PARSER = function (text, format) {
        const array = text.split(RANGE_SEPARATOR);
        if (array.length === 2) {
            const range1 = array[0];
            const range2 = array[1];
            return [parseDate(range1, format), parseDate(range2, format)];
        }
        return [];
    };
    const TYPE_VALUE_RESOLVER_MAP = {
        default: {
            formatter(value) {
                if (!value) return '';
                return '' + value;
            },
            parser(text) {
                if (text === undefined || text === '') return null;
                return text;
            }
        },
        week: {
            formatter(value) {
                if (value instanceof Date) {
                    const weekNumber = getWeekNumber(value);
                    return value.getFullYear() + 'w' + (weekNumber > 9 ? weekNumber : '0' + weekNumber);
                }
                return value;
            },
            parser(text) {
                const array = (text || '').split('w');
                if (array.length === 2) {
                    const year = Number(array[0]);
                    const month = Number(array[1]);

                    if (!isNaN(year) && !isNaN(month) && month < 54) {
                        return text;
                    }
                }
                return null;
            }
        },
        date: {
            formatter: DATE_FORMATTER,
            parser: DATE_PARSER
        },
        datetime: {
            formatter: DATE_FORMATTER,
            parser: DATE_PARSER
        },
        daterange: {
            formatter: RANGE_FORMATTER,
            parser: RANGE_PARSER
        },
        datetimerange: {
            formatter: RANGE_FORMATTER,
            parser: RANGE_PARSER
        },
        timerange: {
            formatter: RANGE_FORMATTER,
            parser: RANGE_PARSER
        },
        time: {
            formatter: DATE_FORMATTER,
            parser: DATE_PARSER
        },
        month: {
            formatter: DATE_FORMATTER,
            parser: DATE_PARSER
        },
        year: {
            formatter: DATE_FORMATTER,
            parser: DATE_PARSER
        },
        number: {
            formatter(value) {
                if (!value) return '';
                return '' + value;
            },
            parser(text) {
                let result = Number(text);

                if (!isNaN(text)) {
                    return result;
                } else {
                    return null;
                }
            }
        }
    };
    const PLACEMENT_MAP = {
        left: 'bottom-start',
        center: 'bottom-center',
        right: 'bottom-end'
    };

    module.exports = {
        mixins: [Emitter, NewPopper],
        template: require('./picker.tpl'),
        props: {
            size: String,
            format: String,
            readonly: Boolean,
            placeholder: String,
            disabled: Boolean,
            clearable: {
                type: Boolean,
                default: true
            },
            popperClass: String,
            editable: {
                type: Boolean,
                default: true
            },
            align: {
                type: String,
                default: 'left'
            },
            value: {},
            rangeSeparator: {
                default: ' - '
            },
            pickerOptions: {}
        },

        components: {ElInput},

        directives: {Clickoutside},

        data() {
            return {
                pickerVisible: false,
                showClose: false,
                currentValue: ''
            };
        },

        watch: {
            pickerVisible(val) {
                if (this.readonly || this.disabled) return;
                val ? this.showPicker() : this.hidePicker();
            },
            currentValue(val) {
                if (val) return;
                if (this.picker && typeof this.picker.handleClear === 'function') {
                    this.picker.handleClear();
                } else {
                    this.$emit('input');
                }
            },
            value: {
                immediate: true,
                handler(val) {
                    this.currentValue = isDate(val) ? new Date(val) : val;
                }
            },
            displayValue(val) {
                this.$emit('change', val);
            }
        },

        computed: {
            reference() {
                return this.$refs.reference.$el;
            },

            refInput() {
                if (this.reference) return this.reference.querySelector('input');
                return {};
            },

            valueIsEmpty() {
                const val = this.currentValue;
                if (Array.isArray(val)) {
                    for (let i = 0, len = val.length; i < len; i++) {
                        if (val[i]) {
                            return false;
                        }
                    }
                } else {
                    if (val) {
                        return false;
                    }
                }
                return true;
            },

            triggerClass() {
                return this.type.indexOf('time') !== -1 ? 'el-icon-time' : 'el-icon-date';
            },

            selectionMode() {
                if (this.type === 'week') {
                    return 'week';
                } else if (this.type === 'month') {
                    return 'month';
                } else if (this.type === 'year') {
                    return 'year';
                }

                return 'day';
            },

            haveTrigger() {
                if (typeof this.showTrigger !== 'undefined') {
                    return this.showTrigger;
                }
                return HAVE_TRIGGER_TYPES.indexOf(this.type) !== -1;
            },

            displayValue: {
                get() {
                    const value = this.currentValue;
                    if (!value) return;
                    const formatter = (
                        TYPE_VALUE_RESOLVER_MAP[this.type] ||
                        TYPE_VALUE_RESOLVER_MAP['default']
                    ).formatter;
                    const format = DEFAULT_FORMATS[this.type];

                    return formatter(value, this.format || format);
                },

                set(value) {
                    if (value) {
                        const type = this.type;
                        const parser = (
                            TYPE_VALUE_RESOLVER_MAP[type] ||
                            TYPE_VALUE_RESOLVER_MAP['default']
                        ).parser;
                        const parsedValue = parser(value, this.format || DEFAULT_FORMATS[type]);

                        if (parsedValue && this.picker) {
                            this.picker.value = parsedValue;
                        }
                    } else {
                        this.picker.value = value;
                    }
                    this.$forceUpdate();
                }
            }
        },

        created() {
            RANGE_SEPARATOR = this.rangeSeparator;
            // vue-popper
            this.options = {
                boundariesPadding: 0,
                gpuAcceleration: false
            };
            this.placement = PLACEMENT_MAP[this.align] || PLACEMENT_MAP.left;
        },

        methods: {
            handleMouseEnterIcon() {
                if (this.readonly || this.disabled) return;
                if (!this.valueIsEmpty && this.clearable) {
                    this.showClose = true;
                }
            },

            handleClickIcon() {
                if (this.readonly || this.disabled) return;
                if (this.showClose) {
                    this.currentValue = '';
                    this.showClose = false;
                } else {
                    this.pickerVisible = !this.pickerVisible;
                }
            },

            dateChanged(dateA, dateB) {
                if (Array.isArray(dateA)) {
                    let len = dateA.length;
                    if (!dateB) return true;
                    while (len--) {
                        if (!equalDate(dateA[len], dateB[len])) return true;
                    }
                } else {
                    if (!equalDate(dateA, dateB)) return true;
                }

                return false;
            },

            handleClose() {
                this.pickerVisible = false;
            },

            handleFocus() {
                const type = this.type;

                if (HAVE_TRIGGER_TYPES.indexOf(type) !== -1 && !this.pickerVisible) {
                    this.pickerVisible = true;
                }
                this.$emit('focus', this);
            },

            handleBlur() {
                this.$emit('blur', this);
                this.dispatch('ElFormItem', 'el.form.blur');
            },

            handleKeydown(event) {
                const keyCode = event.keyCode;

                // tab
                if (keyCode === 9) {
                    this.pickerVisible = false;
                }
            },

            hidePicker() {
                if (this.picker) {
                    this.picker.resetView && this.picker.resetView();
                    this.pickerVisible = this.picker.visible = false;
                    this.destroyPopper();
                }
            },

            showPicker() {
                var that = this;
                if (this.$isServer) return;
                if (!this.picker) {
                    this.panel.defaultValue = this.currentValue;
                    this.picker = new Vue(this.panel).$mount(document.createElement('div'));
                    this.picker.popperClass = this.popperClass;
                    this.popperElm = this.picker.$el;
                    this.picker.width = this.reference.getBoundingClientRect().width;
                    this.picker.showTime = this.type === 'datetime' || this.type === 'datetimerange';
                    this.picker.selectionMode = this.selectionMode;
                    if (this.format) {
                        this.picker.format = this.format;
                    }

                    const updateOptions = function(){
                        const options = that.pickerOptions;

                        if (options && options.selectableRange) {
                            let ranges = options.selectableRange;
                            const parser = TYPE_VALUE_RESOLVER_MAP.datetimerange.parser;
                            const format = DEFAULT_FORMATS.timerange;

                            ranges = Array.isArray(ranges) ? ranges : [ranges];
                            that.picker.selectableRange = ranges.map(
                                function(range){
                                    return parser(range, format)
                                });
                        }

                        for (const option in options) {
                            if (options.hasOwnProperty(option) &&
                                // 忽略 time-picker 的该配置项
                                option !== 'selectableRange') {
                                that.picker[option] = options[option];
                            }
                        }
                    };
                    updateOptions();
                    this.$watch('pickerOptions', function(){updateOptions()}, {deep: true});

                    this.$el.appendChild(this.picker.$el);
                    this.pickerVisible = this.picker.visible = true;
                    this.picker.resetView && this.picker.resetView();

                    this.picker.$on('dodestroy', this.doDestroy);
                    this.picker.$on('pick',
                        function(date, visible = false){
                            if (that.dateChanged(date, this.value)){
                                that.$emit('input', date);
                            }
                            that.pickerVisible = that.picker.visible = visible;
                            that.picker.resetView && that.picker.resetView();
                    });

                    this.picker.$on('select-range', function(start, end){
                        that.refInput.setSelectionRange(start, end);
                        that.refInput.focus();
                    });
                } else {
                    this.pickerVisible = this.picker.visible = true;
                }

                this.updatePopper();

                if (this.currentValue instanceof Date) {
                    this.picker.date = new Date(this.currentValue.getTime());
                } else {
                    this.picker.value = this.currentValue;
                }
                this.picker.resetView && this.picker.resetView();

                this.$nextTick(function(){
                    that.picker.ajustScrollTop && this.picker.ajustScrollTop();
                });
            }
        }
    }
})