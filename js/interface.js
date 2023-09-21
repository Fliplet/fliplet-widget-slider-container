var appPages = [];

Fliplet.Pages.get().then(pages => {
  appPages = pages.map(el => {
    return { value: el.id, label: el.title };
  });
  Fliplet.Widget.generateInterface({
    title: 'slider',
    fields: [
      { name: 'Name', type: 'text', label: 'Name', default: 'MySlider' },
      {
        name: 'Arrows',
        type: 'radio',
        label: 'Show navigation arrows',
        options: [
          { value: true, label: 'Mobile & Desktop' },
          { value: false, label: 'Only Desktop' }
        ],
        default: true
      },
      {
        name: 'Progress',
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
      /* {
        name: 'NavDirection',
        type: 'dropdown',
        label: 'Choose navigation direction',
        options: [
          { value: 'horizontal', label: 'Horizontal' },
          { value: 'vertical', label: 'Vertical' }
        ],
        default: 'horizontal'
      },*/
      {
        name: 'AnimationStyle',
        type: 'dropdown',
        label: 'Transition animation',
        options: [
          { value: '', label: 'None' },
          { value: 'slide', label: 'Slide' },
          // { value: 'cube', label: 'Cube' },
          { value: 'flip', label: 'Flip' },
          { value: 'fade', label: 'Fade' },
          // { value: 'creative', label: 'Creative' },
          // { value: 'cards', label: 'Cards' },
          { value: 'coverflow', label: 'Coverflow' }
        ],
        default: 'fade'
      },
      // {
      //   name: 'skipEnabled',
      //   type: 'checkbox',
      //   label: 'Skip button',
      //   options: [{ value: false, label: 'Hide skip button' }],
      //   default: [false],
      //   change: function (value) {
      //     Fliplet.Helper
      // .field('redirectSkipScreen').toggle(!value.includes(false));
      //   }
      // },
      // IF YES skipEnabled
      // {
      //   name: 'redirectSkipScreen',
      //   type: 'dropdown',
      //   label: 'Display this screen when user taps skip',
      //   options: appPages, // Fliplet.Env.get('appPages'),
      //   default: '',
      //   ready: function (el) {
      //     Fliplet.Helper.field('redirectSkipScreen').toggle(
      //       !Fliplet.Helper.field('skipEnabled')
      //         .get()
      //         .includes(false)
      //     );
      //   }
      // },
      // {
      //   name: 'loopSlides',
      //   type: 'checkbox',
      //   label: 'Loop slides?',
      //   options: [{ value: true, label: 'yes' }],
      //   default: []
      // },
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
        options: appPages, // Fliplet.Env.get('appPages'),
        default: '',
        ready: function(el) {
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

