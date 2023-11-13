/* eslint-disable max-len */
/* eslint-disable new-cap */
/* eslint-disable no-param-reassign */
/* eslint-disable eqeqeq */
/* eslint-disable max-statements */
Fliplet.Widget.instance({
  name: 'slider',
  displayName: 'Slider container',
  icon: 'fa-exchange',
  data: {
    formName: null
  },
  render: {
    dependencies: [
      {
        url: 'https://unpkg.com/swiper@6.5.9/swiper-bundle.min.js',
        type: 'js'
      },
      {
        url: 'https://unpkg.com/swiper@6.5.9/swiper-bundle.min.css',
        type: 'css'
      }
    ],
    template: [
      // '<div class="skip-container">',
      // '<input class="skip-btn" value="Skip" type="button" />',
      // '</div>',
      '<div class="swiper-container">',
      '<div class="swiper-wrapper" data-view="slides"></div>',
      '<div class="swiper-pagination"></div>',
      '<div class="swiper-button-prev"></div>',
      '<div class="swiper-button-next"></div>',
      '</div>'
    ].join(''),
    ready: async function() {
      await Fliplet.Widget.initializeChildren(this.$el, this);

      var pageId = Fliplet.Env.get('pageId');
      var masterPageId = Fliplet.Env.get('pageMasterId');
      var thisSlider = this;

      if ($('[data-name="slide"]').closest('[data-helper="slide"]').length) {
        return Fliplet.UI.Toast('Slide inside slide is not allowed');
      }

      if ($('[data-name="slider"]').closest('[data-helper="slide"]').length) {
        return Fliplet.UI.Toast('Slider inside slide is not allowed');
      }

      this.fields = _.assign({
        // skipEnabled: [false],
        Progress: 'progressbar',
        AnimationStyle: 'fade',
        Arrows: true,
        redirectEndScreen: '',
        firstTime: []
      }, this.fields);

      if (thisSlider.fields.firstTime.includes(true)) {
        Fliplet.App.Storage.get('sliderSeen').then(function(value) {
          if (
            value
            && (value.pageId == pageId
              || value.pageMasterId == masterPageId)
          ) {
            Fliplet.Navigate.screen(thisSlider.fields.redirectEndScreen);
          } else {
            Fliplet.App.Storage.set('sliderSeen', {
              pageId: pageId,
              pageMasterId: masterPageId
            });
          }
        });
      }

      // $(document)
      //   .find('.skip-btn')
      //   .click(function () {
      //     Fliplet.Navigate.screen(thisSlider.fields.redirectSkipScreen);
      //   });

      var vm = this;
      var container = vm.$el.findUntil('.swiper-container', 'fl-helper').get(0);

      if (!container) {
        return;
      }

      $(container).find('[data-name="slide"]').addClass('swiper-slide');
      // $('.skip-container')
      // .toggle(!thisSlider.fields.skipEnabled.includes(false));

      var slides = vm.children({ name: 'slide' });

      if (!slides.length) {
        vm.$el.hide();

        return;
      }

      var swiperOptions = {
        pagination: {
          el: '.swiper-pagination',
          type: this.fields.Progress
        },
        // this.fields.Arrows,
        navigation: {
          nextEl: '.swiper-button-next',
          prevEl: '.swiper-button-prev'
        },
        threshold: 5,
        allowTouchMove: Modernizr.touchevents,
        effect: this.fields.AnimationStyle,
        allowSlideNext: true,
        allowSlidePrev: true,
        autoHeight: true,
        keyboard: {
          enabled: true,
          onlyInViewport: false
        }
      };

      if (this.fields.AnimationStyle == 'fade') {
        swiperOptions.fadeEffect = {
          crossFade: true
        };
      }

      if (!this.fields.Arrows && (Fliplet.Env.get('platform') == 'native'
        || $('.fl-page-content-wrapper').innerWidth() < 600)) {
        $('.swiper-button-next').hide();
        $('.swiper-button-prev').hide();
        swiperOptions.allowTouchMove = true;
      } else {
        $('.swiper-button-next').show();
        $('.swiper-button-prev').show();
        swiperOptions.allowTouchMove = false;
      }

      // eslint-disable-next-line no-undef
      var swiper = new Swiper(container, swiperOptions);

      const autoheightIntervalInstance = setInterval(myTimer, 1000);

      function myTimer() {
        swiper.updateAutoHeight(500);
      }

      function stopAutoheightInterval() {
        clearInterval(autoheightIntervalInstance);
      }

      $(window).bind('beforeunload', function() {
        return stopAutoheightInterval();
      });

      var firstSlide = slides[0];

      if (firstSlide.fields.requiredForm) {
        swiper.allowSlidePrev = !firstSlide.fields.requiredFormBackwardNavigation;
        swiper.allowSlideNext = !firstSlide.fields.requiredFormForwardNavigation;
      }

      Fliplet.Hooks.on('flListDataBeforeGetData', function(options) {
        var $btnPrev = $('.swiper-button-prev');
        var $btnNext = $('.swiper-button-next');

        options.config.beforeOpen = function() {
          $btnPrev.hide();
          $btnNext.hide();
        };

        options.config.afterShowDetails = function() {
          $(document)
            // eslint-disable-next-line max-len
            .find('.small-card-detail-overlay-close, .news-feed-detail-overlay-close')
            .click(function() {
              $btnPrev.show();
              $btnNext.show();
            });
        };
      });

      function loadFormData() {
        var activeSlide = $('[data-name="slide"].swiper-slide-active');
        var formElement = activeSlide.find('[data-name="Form"]');
        var formId = formElement.data('id');

        if (!formId) {
          thisSlider.data.formName = null;

          return Promise.resolve(true);
        }

        var value;

        return Fliplet.FormBuilder.getAll()
          .then(function(forms) {
            var form = forms.find(el => el.instance.id == formId);

            if (form) {
              thisSlider.data.formName = form.data().displayName;

              return Fliplet.App.Storage.get(`${pageId}_${thisSlider.data.formName}`);
            }

            thisSlider.data.formName = null;

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

            return Promise.resolve(true);
          })
          .catch(function() {
            return Fliplet.App.Storage.remove(`${pageId}_${thisSlider.data.formName}`);
          });
      }

      if (Fliplet.FormBuilder) {
        loadFormData();
      }

      vm.swiper = swiper;
      swiper.on('slideChange', function() {
        var _this = this;

        thisSlider.data.formName = null;

        $('video, audio').each(function() {
          this.pause();
        });

        if (Fliplet.FormBuilder) {
          loadFormData().then(async function() {
            var currentSlide = slides[swiper.realIndex];
            var hasFormSubmitted = await Fliplet.App.Storage.get(`${pageId}_${thisSlider.data.formName}`);

            _this.allowSlidePrev = true;
            _this.allowSlideNext = true;

            if (currentSlide && currentSlide.fields.requiredForm && !hasFormSubmitted) {
              _this.allowSlidePrev = !currentSlide.fields.requiredFormBackwardNavigation;
              _this.allowSlideNext = !currentSlide.fields.requiredFormForwardNavigation;
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
          .find('.swiper-pagination, .swiper-button-prev, .swiper-button-next')
          [toggle ? 'show' : 'hide']();
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
      };

      vm.getActiveSlide = function() {
        return vm.children('slide')[swiper.activeIndex];
      };

      Fliplet.Hooks.run('sliderInitialized');

      Fliplet.Hooks.on('beforeFormSubmit', function(formData) {
        return Fliplet.App.Storage.get(`${pageId}_${thisSlider.data.formName}`)
          .then(function(value) {
            if (value) {
              return Fliplet.DataSources.connect(value.dataSourceId)
                .then(function(connection) {
                  if (!value.entryId) return Promise.reject('');

                  return connection.update(value.entryId, formData)
                    .then(() => {
                      swiper.slideNext();

                      return Promise.reject('');
                    });
                });
            }
          });
      });

      Fliplet.Hooks.on('afterFormSubmit', function(response) {
        swiper.allowSlideNext = true;
        swiper.allowSlidePrev = true;

        if (thisSlider.data.formName) {
          return Fliplet.App.Storage
            .set(`${pageId}_${thisSlider.data.formName}`, {
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
        // eslint-disable-next-line max-len
        placeholder: '<div class="well text-center">Add Slide components to build your slider</div>',
        allow: ['slide']
      }
    ]
  }
});
