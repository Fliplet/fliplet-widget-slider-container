Fliplet.Pages.get().then((pages) => {
  let appPages = [];

  appPages = pages.map((el) => {
    return { value: el.id, label: el.title };
  });
  Fliplet.Widget.generateInterface({
    title: 'slider',
    fields: [
      {
        name: 'showArrows',
        type: 'radio',
        label: 'Navigation controls',
        options: [
          { value: true, label: 'Show arrows' },
          { value: 'hidden', label: 'Hide arrows' }
        ],
        default: true
      },
      {
        name: 'navigationNote',
        type: 'div',
        html: 'If you hide the arrows, make sure to add a way for users to navigate between slides — such as a custom "Next" or "Previous" button inside your form. <a href="https://developers.fliplet.com/components/slider-navigation.html" target="_blank">Learn more</a> how to add navigation buttons.',
        className: 'navigation-note'
      },
      {
        name: 'progress',
        type: 'dropdown',
        label: 'Enable progress interface',
        options: [
          { value: 'bullets', label: 'Pagination dots' },
          { value: 'fraction', label: 'Pagination bar' },
          { value: 'progressbar', label: 'Progress line (steps)' }
        ],
        default: 'progressbar'
      },
      {
        name: 'animationStyle',
        type: 'dropdown',
        label: 'Transition animation',
        options: [
          { value: '', label: 'None' },
          { value: 'slide', label: 'Slide' },
          { value: 'fade', label: 'Fade' }
        ],
        default: ''
      },
      {
        name: 'firstTime',
        type: 'checkbox',
        label: 'Show slides only once',
        description:
          'The slides will only be displayed once for first time users',
        options: [{ value: true, label: 'Yes' }],
        default: [],
        change: function(value) {
          Fliplet.Helper.field('redirectEndScreen').toggle(
            value.includes(true)
          );
        }
      },
      // IF YES firstTime
      {
        name: 'redirectEndScreen',
        type: 'dropdown',
        label: 'Select the screen users will be redirected to',
        description:
          'This only applies to users who have already seen the slides',
        options: appPages,
        default: '',
        ready: function() {
          Fliplet.Helper.field('redirectEndScreen').toggle(
            Fliplet.Helper.field('firstTime').get().includes(true)
          );
        }
      }
    ]
  });
});
