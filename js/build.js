/* eslint-disable eqeqeq */
Fliplet.Widget.instance({
  name: 'slider',
  data: {
    formName: null
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
      let masterPageId = Fliplet.Env.get('pageMasterId');
      let vm = this;
      let $vm = $(this);
      let $slider = $($vm[0].$el[0]);
      const interactMode = Fliplet.Env.get('interact');

      function addClassToElements($elements, message) {
        if ($elements.length) {
          $elements.each(function() {
            $(this).addClass('custom-before');

            if (!interactMode) {
              Fliplet.UI.Toast(message);
            }
          });
        }
      }

      function checkAllowedStructure() {
        let $slideInsideSlide = $('[data-helper="slide"] [data-helper="slide"]');
        let $sliderInsideSlide = $slider.closest('[data-helper="slide"]').find('[name="slider"]');
        let notAllowedComponents = $slider.find('.swiper-wrapper > :not(div[data-view-placeholder]):not([data-name="Slide"])');

        addClassToElements($slideInsideSlide, 'Slide inside slide is not allowed');
        addClassToElements($sliderInsideSlide, 'Slider inside slide is not allowed');
        addClassToElements(notAllowedComponents, 'Only Slide components are allowed inside the slider');
      }

      if (interactMode) {
        const $screen = $(document, '#preview').contents().find('.fl-page-content-wrapper');

        const MutationObserver = window.MutationObserver || window.WebKitMutationObserver;

        const previewObserver = new MutationObserver(function() {
          console.log('checked');
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

      vm.fields = _.assign(
        {
          progress: 'progressbar',
          animationStyle: 'fade',
          showArrows: true,
          redirectEndScreen: '',
          firstTime: []
        },
        vm.fields
      );

      if (vm.fields.firstTime.includes(true)) {
        Fliplet.App.Storage.get('sliderSeen').then(function(value) {
          if (
            value
            && (value.pageId == pageId || value.pageMasterId == masterPageId)
          ) {
            Fliplet.Navigate.screen(vm.fields.redirectEndScreen);
          } else {
            Fliplet.App.Storage.set('sliderSeen', {
              pageId: pageId,
              pageMasterId: masterPageId
            });
          }
        });
      }

      var container = vm.$el.findUntil('.swiper-container', 'fl-helper').get(0);

      if (!container) {
        return;
      }

      $(container).find('[data-name="Slide"]').addClass('swiper-slide');

      let slides = vm.children({ name: 'slide' });

      if (!slides.length) {
        vm.$el.hide();

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
        // autoHeight: true,
        keyboard: {
          enabled: true,
          onlyInViewport: false
        }
      };

      if (this.fields.animationStyle == 'fade') {
        swiperOptions.fadeEffect = {
          crossFade: true
        };
      }

      if (this.fields.animationStyle == 'coverflow') {
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
        && (Fliplet.Env.get('platform') == 'native'
          || $('body').innerWidth() < 600)
      ) {
        $slider.find('.swiper-button-next').hide();
        $slider.find('.swiper-button-prev').hide();
        swiperOptions.allowTouchMove = true;
      } else {
        $slider.find('.swiper-button-next').show();
        $slider.find('.swiper-button-prev').show();
        swiperOptions.allowTouchMove = false;
      }

      let swiper = new Swiper(container, swiperOptions);

      // let autoheightIntervalInstance = setInterval(updateAutoHeightTimer, 1000);

      // function updateAutoHeightTimer() {
      //   swiper.updateAutoHeight(500);
      // }

      // function stopAutoheightInterval() {
      //   clearInterval(autoheightIntervalInstance);
      // }

      // $(window).bind('beforeunload', function() {
      //   return stopAutoheightInterval();
      // });

      let firstSlide = slides[0];

      if (firstSlide.fields.requiredForm) {
        swiper.allowSlidePrev
          = !firstSlide.fields.requiredFormBackwardNavigation;
        swiper.allowSlideNext
          = !firstSlide.fields.requiredFormForwardNavigation;
      }

      Fliplet.Hooks.on('flListDataBeforeGetData', function(options) {
        let $btnPrev = $slider.find('.swiper-button-prev');
        let $btnNext = $slider.find('.swiper-button-next');

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

      function loadFormData() {
        let $activeSlide = $slider.find(
          '[data-name="Slide"].swiper-slide-active'
        );
        let formElement = $activeSlide.find('[data-name="Form"]');
        let formId = formElement.data('id');
        let value;

        if (!formId) {
          vm.data.formName = null;

          return Promise.resolve(true);
        }

        return Fliplet.FormBuilder.getAll()
          .then(function(forms) {
            let form = forms.find((el) => el.instance.id == formId);

            if (form) {
              vm.data.formName = form.data().displayName;

              return Fliplet.App.Storage.get(`${pageId}${vm.data.formName}`);
            }

            vm.data.formName = null;

            return Promise.resolve(false);
          })
          .then(function(storageValue) {
            value = storageValue;

            if (value) {
              return Fliplet.DataSources.connect(value.dataSourceId);
            }
          })
          .then(function(connection) {
            if (!connection || !value.entryId) {
              return Promise.reject('');
            }

            return connection.findById(value.entryId);
          })
          .then(function(record) {
            if (record) {
              return Fliplet.FormBuilder.get().then(function(form) {
                return new Promise(function(resolve) {
                  form.load(function() {
                    resolve(record.data);
                  });
                });
              });
            }

            return true;
          })
          .catch(function() {
            return Fliplet.App.Storage.remove(`${pageId}${vm.data.formName}`);
          });
      }

      if (Fliplet.FormBuilder) {
        loadFormData();
      }

      vm.swiper = swiper;
      swiper.on('slideChange', function() {
        let slideObject = this;

        vm.data.formName = null;

        $slider.find('video, audio').each(function() {
          this.pause();
        });

        if (Fliplet.FormBuilder) {
          loadFormData().then(async function() {
            let currentSlide = slides[swiper.realIndex];
            let hasFormSubmitted = await Fliplet.App.Storage.get(
              `${pageId}${vm.data.formName}`
            );

            slideObject.allowSlidePrev = true;
            slideObject.allowSlideNext = true;

            if (
              currentSlide
              && currentSlide.fields.requiredForm
              && !hasFormSubmitted
            ) {
              slideObject.allowSlidePrev
                = !currentSlide.fields.requiredFormBackwardNavigation;
              slideObject.allowSlideNext
                = !currentSlide.fields.requiredFormForwardNavigation;
            }

            Fliplet.Page.scrollTo(vm.$el);
          });
        }
      });

      vm.showNav = true;

      vm.toggleNav = function(toggle) {
        if (typeof toggle === 'undefined') {
          toggle = !vm.showNav;
        }

        vm.$el
          .find('.swiper-pagination, .swiper-button-prev, .swiper-button-next')[toggle ? 'show' : 'hide']();
        vm.showNav = !!toggle;
        vm.swiper.allowTouchMove = toggle ? Modernizr.touchevents : false;
        vm.swiper.update();
      };

      vm.togglePrevNav = function(toggle) {
        if (typeof toggle === 'undefined') {
          toggle = vm.$el.hasClass('swiper-nav-prev-disabled');
        }

        vm.$el[toggle ? 'removeClass' : 'addClass']('swiper-nav-prev-disabled');
        vm.swiper.allowSlidePrev = !!toggle;
        vm.swiper.update();
      };

      vm.toggleNextNav = function(toggle) {
        if (typeof toggle === 'undefined') {
          toggle = vm.$el.hasClass('swiper-nav-next-disabled');
        }

        vm.$el[toggle ? 'removeClass' : 'addClass']('swiper-nav-next-disabled');
        vm.swiper.allowSlideNext = !!toggle;
        vm.swiper.update();
      };

      vm.slidePrev = function() {
        swiper.slidePrev.apply(swiper, arguments);
      };

      vm.slideNext = function() {
        swiper.slideNext.apply(swiper, arguments);
      };

      vm.slideTo = function() {
        swiper.slideTo.apply(swiper, arguments);
        swiper.updateAutoHeight(500);
      };

      vm.getActiveSlide = function() {
        return vm.children('slide')[swiper.activeIndex];
      };

      Fliplet.Hooks.run('sliderInitialized');

      Fliplet.Hooks.on('beforeFormSubmit', function(formData) {
        return Fliplet.App.Storage.get(`${pageId}${vm.data.formName}`).then(
          function(value) {
            if (value) {
              return Fliplet.DataSources.connect(value.dataSourceId).then(
                function(connection) {
                  if (!value.entryId) return Promise.reject('');

                  return connection.update(value.entryId, formData).then(() => {
                    swiper.slideNext();

                    return Promise.reject('');
                  });
                }
              );
            }
          }
        );
      });

      Fliplet.Hooks.on('afterFormSubmit', function(response) {
        swiper.allowSlideNext = true;
        swiper.allowSlidePrev = true;

        if (vm.data.formName) {
          return Fliplet.App.Storage.set(`${pageId}${vm.data.formName}`, {
            entryId: response.result.id,
            dataSourceId: response.result.dataSourceId
          }).then(function() {
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
