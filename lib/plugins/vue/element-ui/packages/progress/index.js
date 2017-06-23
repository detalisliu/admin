

define(function(require,exports,modules) {

  modules.exports = {
    name: 'ElProgress',
    template:require('./progress.tpl'),
    install : function(Vue) {
      Vue.component(this.name, this);
    },
    props: {
      type: {
        type: String,
        default: 'line',
        validator: val => ['line', 'circle'].indexOf(val) > -1
    },
    percentage: {
      type: Number,
      default: 0,
      required: true,
      validator: function(val){return val >= 0 && val <= 100}
  },
  status: {
    type: String
  },
  strokeWidth: {
    type: Number,
  default: 6
  },
  textInside: {
    type: Boolean,
  default: false
  },
  width: {
    type: Number,
  default: 126
  },
  showText: {
    type: Boolean,
  default: true
  }
},
  computed: {
    barStyle() {
      var style = {};
      style.width = this.percentage + '%';
      return style;
    },
    relativeStrokeWidth() {
      return (this.strokeWidth / this.width * 100).toFixed(1);
    },
    trackPath() {
      var radius = parseInt(50 - parseFloat(this.relativeStrokeWidth) / 2, 10);

      return `M 50 50 m 0 -${radius} a ${radius} ${radius} 0 1 1 0 ${radius * 2} a ${radius} ${radius} 0 1 1 0 -${radius * 2}`;
    },
    perimeter() {
      var radius = 50 - parseFloat(this.relativeStrokeWidth) / 2;
      return 2 * Math.PI * radius;
    },
    circlePathStyle() {
      var perimeter = this.perimeter;
      return {
        strokeDasharray: `${perimeter}px,${perimeter}px`,
        strokeDashoffset: (1 - this.percentage / 100) * perimeter + 'px',
        transition: 'stroke-dashoffset 0.6s ease 0s, stroke 0.6s ease'
      };
    },
    stroke() {
      var ret;
      switch (this.status) {
        case 'success':
          ret = '#13ce66';
          break;
        case 'exception':
          ret = '#ff4949';
          break;
        default:
          ret = '#20a0ff';
      }
      return ret;
    },
    iconClass() {
      if (this.type === 'line') {
        return this.status === 'success' ? 'el-icon-circle-check' : 'el-icon-circle-cross';
      } else {
        return this.status === 'success' ? 'el-icon-check' : 'el-icon-close';
      }
    },
    progressTextSize() {
      return this.type === 'line'
          ? 12 + this.strokeWidth * 0.4
          : this.width * 0.111111 + 2 ;
    }
  }
};
})