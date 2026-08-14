<template>
    <svg viewBox="0 0 24 24" :class="iconClass" :style="iconStyle">
      <path :d="iconPath" />
    </svg>
  </template>
  
  <script>
  export default {
    name: 'Icon',
    props: {
      name: {
        type: String,
        required: true,
      },
    },
    computed: {
      iconPath() {
        return this.icons[this.name];
      },
      iconClass() {
        return `option-icon ${this.name}-icon`;
      },
      iconStyle() {
        return {
          width: '24px',
          height: '24px',
          marginRight: '10px',
          fill: '#000000',
          cursor: 'pointer',
        };
      },
    },
    data() {
      return {
        icons: {
          'logout-icon': 'M17 7L15.59 8.41L18.17 11H8V13H18.17L15.59 15.58L17 17L22 12M4 5H12V3H4C2.9 3 2 3.9 2 5V19C2 20.1 2.9 21 4 21H12V19H4V5Z',
        },
      };
    },
  };
  </script>
  
  <style scoped>
  .option-icon {
    width: 24px;
    height: 24px;
    margin-right: 10px;
    cursor: pointer;
  }
  
  .option-icon:focus {
    outline: none;
    box-shadow: 0 0 0 2px #000000;
  }
  </style>