Fliplet.Widget.instance({
  name: 'slider',
  displayName: 'Slider container',
  data: {},
  render: {
    template: [
      '<div class="swiper-container" role="region" aria-label="Slider container">',
      '<div class="swiper-wrapper" data-view="slides" role="list"></div>',
      '<div class="swiper-pagination" role="tablist"></div>',
      '<div class="swiper-button-prev" role="button" aria-label="Previous slide" tabindex="0" data-can-swipe="false"></div>',
      '<div class="swiper-button-next" role="button" aria-label="Next slide" tabindex="0" data-can-swipe="false"></div>',
      '</div>'
    ].join(''),
    ready: async function() {
      await Fliplet.Widget.initializeChildren(this.$el, this);

      let submittedForms = [];
      let pageId = Fliplet.Env.get('pageId');
      let pageMasterId = Fliplet.Env.get('pageMasterId');
      let slider = this;
      let $slider = $(this);
      let $sliderElement = $($slider[0].el);
      const interactMode = Fliplet.Env.get('interact');
      const notAllowedCustomHelpers = [
        'authTitle',
        'conditional-container',
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

      function errorMessageStructureNotValid($elements, message) {
        $elements.each(function(index) {
          $(this).addClass('component-error-before');

          if (!interactMode && index === 0) {
            Fliplet.UI.Toast(message);
          }
        });
      }

      function scrollToTopOfSlide() {
        $(slider.$el).animate(
          {
            scrollTop: $('.swiper-slide-active').offset().top - 40
          },
          1
        );
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

        let notAllowedSelectors = notAllowedCustomHelpers
          .map((helper) => `[name="${helper}"]`)
          .join(',');
        let $notAllowedHelpers = $(slider.el)
          .find('.swiper-wrapper fl-helper')
          .filter(notAllowedSelectors);

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
        } else if ($sliderInsideSlider.length) {
          return errorMessageStructureNotValid(
            $sliderInsideSlider,
            'Slider inside slider is not allowed'
          );
        } else if ($notAllowedHelpers.length) {
          return errorMessageStructureNotValid(
            $notAllowedHelpers,
            'Helpers are not supported inside the slider'
          );
        } else if ($notAllowedComponents.length) {
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

        const MutationObserver =
          window.MutationObserver || window.WebKitMutationObserver;

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
          animationStyle: '',
          showArrows: true,
          redirectEndScreen: '',
          firstTime: []
        },
        slider.fields
      );

      if (slider.fields.firstTime.includes(true)) {
        await Fliplet.App.Storage.get(`slider_seen_${pageId}`).then((value) => {
          if (
            value &&
            (value.pageId === pageId || value.pageMasterId === pageMasterId)
          ) {
            return Fliplet.Navigate.screen(slider.fields.redirectEndScreen);
          }

          return Fliplet.App.Storage.set(`slider_seen_${pageId}`, {
            pageId,
            pageMasterId
          });
        });
      } else {
        await Fliplet.App.Storage.remove(`slider_seen_${pageId}`);
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
          type: this.fields.progress,
          renderBullet: function(index, className) {
            return (
              '<span class="' +
              className +
              '" role="tab" aria-label="Go to slide ' +
              (index + 1) +
              '" tabindex="0"></span>'
            );
          }
        },
        navigation: {
          nextEl: '.swiper-button-next',
          prevEl: '.swiper-button-prev'
        },
        a11y: {
          enabled: true,
          prevSlideMessage: 'Previous slide',
          nextSlideMessage: 'Next slide',
          firstSlideMessage: 'This is the first slide',
          lastSlideMessage: 'This is the last slide',
          paginationBulletMessage: 'Go to slide {{index}}'
        },
        threshold: 5,
        allowTouchMove: Modernizr.touchevents,
        allowSlideNext: false,
        allowSlidePrev: false,
        autoHeight: true,
        keyboard: {
          enabled: true,
          onlyInViewport: false
        }
      };

      if (this.fields.animationStyle === '') {
        swiperOptions.speed = 0;
        swiperOptions.effect = 'slide';
        swiperOptions.touchRatio = 1;
        swiperOptions.resistanceRatio = 0;

        $sliderElement.find('.swiper-wrapper').css('transition', 'none');
      } else {
        swiperOptions.effect = this.fields.animationStyle;
      }

      if (this.fields.animationStyle === 'fade') {
        swiperOptions.fadeEffect = {
          crossFade: true
        };
      }

      if (this.fields.showArrows == 'hidden') {
        $sliderElement.find('.swiper-button-next').hide();
        $sliderElement.find('.swiper-button-prev').hide();
        swiperOptions.allowTouchMove = true;
      } else if (
        !this.fields.showArrows &&
        (Fliplet.Env.get('platform') === 'native' ||
          $('body').innerWidth() < 640)
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

      let swiper = new Swiper(firstContainer, swiperOptions);

      $sliderElement
        .find('[data-button-action]')
        .off('click')
        .on('click', function() {
          if ($(this).attr('data-can-swipe') === 'true') {
            if ($(this).attr('data-button-action') === 'previous-slide') {
              swiper.slidePrev();
            } else {
              swiper.slideNext();
            }
          }
        });


      swiper.allowSlidePrev = firstSlide.fields.requiredFormBackwardNavigation;
      swiper.allowSlideNext = true;

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
              '.small-card-detail-overlay-close, .news-feed-detail-overlay-close, .agenda-detail-overlay-close'
            )
            .click(function() {
              if (
                slider.fields.showArrows !== 'hidden' &&
                !slider.fields.showArrows &&
                (Fliplet.Env.get('platform') === 'native' ||
                  $('body').innerWidth() < 640)
              ) {
                $btnPrev.show();
                $btnNext.show();
              }
            });
        };
      });

      slider.swiper = swiper;

      swiper.on('slideChangeTransitionStart', async function() {
        const activeArrow = this.activeIndex > this.previousIndex ? 'next' : 'prev';

        if (activeArrow === 'prev' || !Fliplet.FormBuilder) return;

        const forms = await Fliplet.FormBuilder.getAll();

        if (!forms.length) return;

        const previousIndex = swiper.previousIndex;
        const previousSlideId = slides[previousIndex].id;

        setTimeout(() => {
          const currentSlideForm = forms.filter(form => form.$instance.slideId === previousSlideId);
          const canSwipe = currentSlideForm.every(form => form.$instance.isFormValid);

          if (!canSwipe) {
            swiper.slideTo(swiper.previousIndex, 0, false);
          }
        }, 0);
      });

      swiper.on('slideChange', async function() {
        $sliderElement.find('video, audio').each(function() {
          this.pause();
        });

        let currentSlide = slides[swiper.realIndex];

        if (
          currentSlide
        ) {
          swiper.allowSlidePrev = !currentSlide.fields.requiredFormBackwardNavigation;
        }

        swiper.updateAutoHeight(500);

        if (!interactMode) {
          scrollToTopOfSlide();
        }

        setTimeout(() => {
          $(firstContainer).find('.swiper-slide').attr('aria-hidden', 'true');
          $(firstContainer)
            .find('.swiper-slide-active')
            .attr('aria-hidden', 'false');
        }, 300);
      });

      Fliplet.Hooks.run('sliderInitialized');

      Fliplet.Hooks.on('afterFormSubmit', function(response, data) {
        let $activeSlide = slides[swiper.realIndex].$el;
        let $formElement = $activeSlide.find(
          '[data-widget-package="com.fliplet.form-builder"]'
        );
        let formId = $formElement.data('id');

        submittedForms.push(formId);

        if (data.$instance.redirect === 'nextSlide') {
          swiper.slideNext();
        }
      });

      $(firstContainer)
        .find('.swiper-slide')
        .each(function(index) {
          $(this).attr({
            role: 'listitem',
            'aria-label': 'Slide ' + (index + 1)
          });
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
