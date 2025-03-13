Fliplet.Pages.get().then(pages => {
  let appPages = [];

  appPages = pages.map(el => {
    return { value: el.id, label: el.title };
  });
  Fliplet.Widget.generateInterface({
    title: 'slider',
    fields: [
      {
        name: 'sliderNavigation',
        type: 'radio',
        label: 'Slider navigation',
        options: [
          { value: 'button', label: 'Button' },
          { value: 'arrows', label: 'Arrows' }
        ],
        default: 'button',
        change: function(value) {
          Fliplet.Helper.field('showArrows').toggle(value.includes('arrows'));
          Fliplet.Helper.field('nextButtonLabel').toggle(value.includes('button'));
          Fliplet.Helper.field('backButtonLabel').toggle(value.includes('button'));
          $('.multi-step-text').toggle(value.includes('button'));
        },
        ready: function() {
          Fliplet.Helper.field('showArrows').toggle(value.includes('arrows'));
          Fliplet.Helper.field('nextButtonLabel').toggle(value.includes('button'));
          Fliplet.Helper.field('backButtonLabel').toggle(value.includes('button'));
          $('.multi-step-text').toggle(value.includes('button'));
        }
      },
      {
        type: 'text',
        name: 'nextButtonLabel',
        label: 'Next button label',
        placeholder: 'Next',
        default: 'Next'
      },
      {
        type: 'text',
        name: 'backButtonLabel',
        label: 'Back button label',
        placeholder: 'Back',
        default: 'Back'
      },
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
        type: 'html',
        html: `<p class='multi-step-text'>Create multi-step forms by adding forms linked to the same data source to Slides.
        Add a 'Submit' button on the last slide to save all data.</p>`
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

