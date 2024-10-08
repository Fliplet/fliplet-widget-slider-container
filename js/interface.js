Fliplet.Pages.get().then(pages => {
  let appPages = [];

  appPages = pages.map(el => {
    return { value: el.id, label: el.title };
  });
  Fliplet.Widget.generateInterface({
    title: 'slider',
    fields: [
      {
        name: 'showArrows',
        type: 'radio',
        label: 'Show navigation arrows on',
        options: [
          { value: true, label: 'Mobile & Desktop' },
          { value: false, label: 'Only on Desktop' }
        ],
        default: true
      },
      {
        name: 'progress',
        type: 'dropdown',
        label: 'Show progress',
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
        label: 'Display slides once',
        description: 'The slides will only be displayed once for first time users',
        options: [{ value: true, label: 'Yes' }],
        default: [],
        change: function(value) {
          Fliplet.Helper.field('redirectEndScreen')
            .toggle(value.includes(true));
        }
      },
      // IF YES firstTime
      {
        name: 'redirectEndScreen',
        type: 'dropdown',
        label: 'Select the screen users will be redirected to',
        description: 'This only applies to users who have already seen the slides',
        options: appPages,
        default: '',
        ready: function() {
          Fliplet.Helper.field('redirectEndScreen').toggle(
            Fliplet.Helper.field('firstTime')
              .get()
              .includes(true)
          );
        }
      }
    ]
  });
});

