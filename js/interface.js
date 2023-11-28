Fliplet.Pages.get().then(pages => {
  var appPages = [];

  appPages = pages.map(el => {
    return { value: el.id, label: el.title };
  });
  Fliplet.Widget.generateInterface({
    title: 'slider',
    fields: [
      {
        name: 'showArrows',
        type: 'radio',
        label: 'Show navigation arrows',
        options: [
          { value: true, label: 'Mobile & Desktop' },
          { value: false, label: 'Only Desktop' }
        ],
        default: true
      },
      {
        name: 'progress',
        type: 'dropdown',
        label: 'Enable progress interface',
        options: [
          { value: '', label: 'No progress' },
          { value: 'bullets', label: 'Pagination dots' },
          { value: 'fraction', label: 'Progress bar' },
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
          { value: 'flip', label: 'Flip' },
          { value: 'fade', label: 'Fade' },
          { value: 'coverflow', label: 'Coverflow' }
        ],
        default: 'fade'
      },
      {
        name: 'firstTime',
        type: 'checkbox',
        label: 'Show slides only once',
        options: [{ value: true, label: 'yes' }],
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
        label: 'Display this screen to returning users',
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

