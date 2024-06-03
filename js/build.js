Fliplet.Widget.instance({
  name: 'slider',
  displayName: 'Slider container',
  data: {
    formId: null
  },
  render: {
    template: [
      '<div class="swiper-container">',
      '<div class="swiper-wrapper" data-view="slides"></div>',
      '<div class="swiper-pagination"></div>',
      '<div class="swiper-button-prev"></div>',
      '<div class="swiper-button-next"></div>',
      '</div>'
    ].join(''),
    ready: async function() {
      await Fliplet.Widget.initializeChildren(this.$el, this);

      let pageId = Fliplet.Env.get('pageId');
      let pageMasterId = Fliplet.Env.get('pageMasterId');
      let slider = this;
      let $slider = $(this);
      let $sliderElement = $($slider[0].el);
      const interactMode = Fliplet.Env.get('interact');
      const notAllowedCustomHelpers = [
        'authTitle',
        'conditionalContainer',
        'map',
        'analyze',
        'accordionStart',
        'accordionEnd',
        'glossary',
        'benchmark',
        'question',
        'answer',
        'result',
        'decision-tree',
        'iframe'
      ];

      function manageSliderActions() {
        slider.showNav = true;

        slider.toggleNav = function(toggle) {
          if (typeof toggle === 'undefined') {
            toggle = !slider.showNav;
          }

          slider.$el
            .find(
              '.swiper-pagination, .swiper-button-prev, .swiper-button-next'
            )[toggle ? 'show' : 'hide']();
          slider.showNav = !!toggle;
          slider.swiper.allowTouchMove = toggle ? Modernizr.touchevents : false;
          slider.swiper.update();
        };

        slider.togglePrevNav = function(toggle) {
          if (typeof toggle === 'undefined') {
            toggle = slider.$el.hasClass('swiper-nav-prev-disabled');
          }

          slider.$el[toggle ? 'removeClass' : 'addClass'](
            'swiper-nav-prev-disabled'
          );
          slider.swiper.allowSlidePrev = !!toggle;
          slider.swiper.update();
        };

        slider.toggleNextNav = function(toggle) {
          if (typeof toggle === 'undefined') {
            toggle = slider.$el.hasClass('swiper-nav-next-disabled');
          }

          slider.$el[toggle ? 'removeClass' : 'addClass'](
            'swiper-nav-next-disabled'
          );
          slider.swiper.allowSlideNext = !!toggle;
          slider.swiper.update();
        };

        slider.slidePrev = function() {
          swiper.slidePrev.apply(swiper, arguments);
        };

        slider.slideNext = function() {
          swiper.slideNext.apply(swiper, arguments);
        };

        slider.slideTo = function() {
          swiper.slideTo.apply(swiper, arguments);
          swiper.updateAutoHeight(500);
        };

        slider.getActiveSlide = function() {
          return slider.children('slide')[swiper.activeIndex];
        };
      }

      function loadFormData() {
        let $activeSlide = slides[swiper.realIndex].$el;
        let $formElement = $activeSlide.find(
          '[data-widget-package="com.fliplet.form-builder"]'
        );
        let formId = $formElement.data('id');
        let value;

        if (!formId) {
          slider.data.formId = null;

          return Promise.resolve(true);
        }

        return Fliplet.FormBuilder.getAll()
          .then((forms) => {
            let form = forms.find((el) => el.instance.id === formId);

            if (form) {
              slider.data.formId = form.data().id;

              return Fliplet.App.Storage.get(`${pageId}${slider.data.formId}`);
            }

            slider.data.formId = null;

            return Promise.resolve(false);
          })
          .then((storageValue) => {
            value = storageValue;

            if (value) {
              return Fliplet.DataSources.connect(value.dataSourceId);
            }

            return Promise.reject('');
          })
          .then((connection) => {
            if (!connection || !value.entryId) {
              return Promise.reject('');
            }

            return connection.findById(value.entryId);
          })
          .then((record) => {
            if (record) {
              return Fliplet.FormBuilder.get().then((form) => {
                return new Promise((resolve) => {
                  form.load(resolve(record.data));
                });
              });
            }

            return new Promise((resolve) => resolve(true));
          })
          .catch(function() {
            return Fliplet.App.Storage.remove(
              `${pageId}${slider.data.formId}`
            ).then(() => {
              return new Promise((resolve) => resolve(true));
            });
          });
      }

      function errorMessageStructureNotValid($elements, message) {
        $elements.each(function(index) {
          $(this).addClass('component-error-before');

          if (!interactMode && index === 0) {
            Fliplet.UI.Toast(message);
          }
        });
      }

      function checkAllowedStructure() {
        $('.swiper-container *').removeClass('component-error-before');

        let $slideInsideSlide = $(
          '[data-helper="slide"] [data-helper="slide"]'
        );
        let $sliderInsideSlider = $(slider.el).find(
          '[data-widget-package="com.fliplet.slider-container"]'
        );
        let $notAllowedComponents = $(slider.el).find(
          '.swiper-wrapper > :not(div[data-view-placeholder]):not([data-widget-package="com.fliplet.slide"]):not(.fl-drop-marker.horizontal)'
        );

        let notAllowedSelector = '.swiper-wrapper fl-helper';

        notAllowedCustomHelpers.forEach((helper) => {
          notAllowedSelector += `:not([name="${helper}"])`;
        });

        let $notAllowedHelpers = $(slider.el).find(notAllowedSelector);

        $('[data-widget-package="com.fliplet.slide"]').each((ind, el) => {
          if (
            !$(el).parents(
              '[data-widget-package="com.fliplet.slider-container"]'
            ).length
          ) {
            return errorMessageStructureNotValid(
              $(el),
              'Slide must be inside the Slider'
            );
          }
        });

        if ($slideInsideSlide.length) {
          return errorMessageStructureNotValid(
            $slideInsideSlide,
            'Slide inside slide is not allowed'
          );
        }

        if ($sliderInsideSlider.length) {
          return errorMessageStructureNotValid(
            $sliderInsideSlider,
            'Slider inside slider is not allowed'
          );
        }

        if ($notAllowedHelpers.length) {
          return errorMessageStructureNotValid(
            $notAllowedHelpers,
            'Helpers are not supported inside the slider'
          );
        }

        if ($notAllowedComponents.length) {
          return errorMessageStructureNotValid(
            $notAllowedComponents,
            'Only Slide components are allowed inside the slider'
          );
        }
      }

      if (interactMode) {
        const $screen = $(document, '#preview')
          .contents()
          .find('.fl-page-content-wrapper');

        const MutationObserver
          = window.MutationObserver || window.WebKitMutationObserver;

        const previewObserver = new MutationObserver(function() {
          checkAllowedStructure();
        });

        previewObserver.observe($screen[0], {
          subtree: true,
          attributes: false,
          childList: true
        });
      } else {
        checkAllowedStructure();
      }

      slider.fields = _.assign(
        {
          progress: 'progressbar',
          animationStyle: 'fade',
          showArrows: true,
          redirectEndScreen: '',
          firstTime: []
        },
        slider.fields
      );

      if (slider.fields.firstTime.includes(true)) {
        await Fliplet.App.Storage.get(`sliderSeen_${pageId}`).then((value) => {
          if (
            value
            && (value.pageId === pageId || value.pageMasterId === pageMasterId)
          ) {
            return Fliplet.Navigate.screen(slider.fields.redirectEndScreen);
          }

          return Fliplet.App.Storage.set(`sliderSeen_${pageId}`, {
            pageId,
            pageMasterId
          });
        });
      } else {
        await Fliplet.App.Storage.remove(`sliderSeen_${pageId}`);
      }

      let container = slider.$el.findUntil('.swiper-container', 'fl-helper');

      if (!container.length) {
        return;
      }

      let firstContainer = container.get(0);

      $(firstContainer)
        .find('[data-widget-package="com.fliplet.slide"]')
        .addClass('swiper-slide');

      let slides = slider.children({ name: 'slide' });

      if (!slides.length) {
        slider.$el.hide();

        return;
      }

      let swiperOptions = {
        pagination: {
          el: '.swiper-pagination',
          type: this.fields.progress
        },
        navigation: {
          nextEl: '.swiper-button-next',
          prevEl: '.swiper-button-prev'
        },
        threshold: 5,
        allowTouchMove: Modernizr.touchevents,
        effect: this.fields.animationStyle,
        allowSlideNext: true,
        allowSlidePrev: true,
        autoHeight: true,
        keyboard: {
          enabled: true,
          onlyInViewport: false
        }
      };

      if (this.fields.animationStyle === 'fade') {
        swiperOptions.fadeEffect = {
          crossFade: true
        };
      }

      if (this.fields.animationStyle === 'coverflow') {
        swiperOptions.fadeEffect = {
          grabCursor: 'true',
          centeredSlides: 'true',
          coverflowEffect: {
            rotate: 50,
            stretch: 0,
            depth: 100,
            modifier: 1,
            slideShadows: true
          }
        };
      }

      if (
        !this.fields.showArrows
        && (Fliplet.Env.get('platform') === 'native'
          || $('body').innerWidth() < 640)
      ) {
        $sliderElement.find('.swiper-button-next').hide();
        $sliderElement.find('.swiper-button-prev').hide();
        swiperOptions.allowTouchMove = true;
      } else {
        $sliderElement.find('.swiper-button-next').show();
        $sliderElement.find('.swiper-button-prev').show();
        swiperOptions.allowTouchMove = false;
      }

      let firstSlide = slides[0];

      if (firstSlide.fields.requiredForm) {
        swiperOptions.allowSlidePrev
          = !firstSlide.fields.requiredFormBackwardNavigation;
        swiperOptions.allowSlideNext
          = !firstSlide.fields.requiredFormForwardNavigation;
      }

      let swiper = new Swiper(firstContainer, swiperOptions);

      Fliplet.Hooks.on('flListDataBeforeGetData', function(options) {
        let $btnPrev = $sliderElement.find('.swiper-button-prev');
        let $btnNext = $sliderElement.find('.swiper-button-next');

        options.config.beforeOpen = function() {
          $btnPrev.hide();
          $btnNext.hide();
        };

        options.config.afterShowDetails = function() {
          $(document)
            .find(
              '.small-card-detail-overlay-close, .news-feed-detail-overlay-close'
            )
            .click(function() {
              $btnPrev.show();
              $btnNext.show();
            });
        };
      });

      slider.swiper = swiper;

      if (Fliplet.FormBuilder) {
        loadFormData().then(async function() {
          let currentSlide = slides[swiper.realIndex];
          let isFormSubmitted = await Fliplet.App.Storage.get(
            `${pageId}${slider.data.formId}`
          );

          slider.swiper.allowSlidePrev = true;
          slider.swiper.allowSlideNext = true;

          if (
            currentSlide
            && currentSlide.fields.requiredForm
            && !isFormSubmitted
          ) {
            slider.swiper.allowSlidePrev
              = !currentSlide.fields.requiredFormBackwardNavigation;
            slider.swiper.allowSlideNext
              = !currentSlide.fields.requiredFormForwardNavigation;
          }

          Fliplet.Page.scrollTo(slider.$el);
        });
      }

      swiper.on('slideChange', async function() {
        let slideObject = this;

        slider.data.formId = null;

        $sliderElement.find('video, audio').each(function() {
          this.pause();
        });

        if (Fliplet.FormBuilder) {
          loadFormData().then(async function() {
            // slides[swiper.realIndex]
            let currentSlide = slides[swiper.realIndex];
            let isFormSubmitted = await Fliplet.App.Storage.get(
              `${pageId}${slider.data.formId}`
            );

            slideObject.allowSlidePrev = true;
            slideObject.allowSlideNext = true;

            if (
              currentSlide
              && currentSlide.fields.requiredForm
              && !isFormSubmitted
            ) {
              slideObject.allowSlidePrev
                = !currentSlide.fields.requiredFormBackwardNavigation;
              slideObject.allowSlideNext
                = !currentSlide.fields.requiredFormForwardNavigation;
            }

            Fliplet.Page.scrollTo(slider.$el);
          });
        }
      });

      manageSliderActions();

      Fliplet.Hooks.run('sliderInitialized');

      Fliplet.Hooks.on('beforeFormSubmit', function(formData) {
        return Fliplet.App.Storage.get(`${pageId}${slider.data.formId}`).then(
          (value) => {
            if (value && value.entryId) {
              swiper.allowSlidePrev = true;
              swiper.allowSlideNext = true;

              return Fliplet.DataSources.connect(value.dataSourceId).then(
                (connection) => {
                  return connection.update(value.entryId, formData).then(() => {
                    swiper.slideNext();

                    return Promise.reject('');
                  });
                }
              );
            }

            return Promise.resolve(true);
          }
        );
      });

      Fliplet.Hooks.on('afterFormSubmit', function(response) {
        swiper.allowSlideNext = true;
        swiper.allowSlidePrev = true;

        if (slider.data.formId) {
          return Fliplet.App.Storage.set(`${pageId}${slider.data.formId}`, {
            entryId: response.result.id,
            dataSourceId: response.result.dataSourceId
          }).then(() => {
            swiper.slideNext();

            return Promise.reject('');
          });
        }

        swiper.slideNext();

        return Promise.reject('');
      });
    },
    views: [
      {
        name: 'slides',
        displayName: 'Slides',
        placeholder:
          '<div class="well text-center">Add Slide components to build your slider</div>',
        allow: ['slide']
      }
    ]
  }
});
