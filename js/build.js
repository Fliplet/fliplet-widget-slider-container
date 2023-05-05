// var appPages = [];
// Fliplet.Pages.get().then(pages => {
//   appPages = pages.map(el => {
//     return { value: el.id, label: el.title };
//   });
Fliplet.Widget.instance({
  name: 'slider',
  displayName: 'slider',
  icon: 'fa-exchange',
  data: {
    formName: null,
    // appPages: Fliplet.Env.get('appPages')
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
    ready: function () {
      Fliplet.Widget.initializeChildren(this.$el, this);

      var thisSlider = this;
      this.fields = _.assign({
        // skipEnabled: [false],
        Progress: 'progressbar',
        loopSlides: [],
        AnimationStyle: 'fade',
        Arrows: true,
        redirectEndScreen: '',
        firstTime: []
      }, this.fields)

      if (thisSlider.fields.firstTime.includes(true)) {
        Fliplet.App.Storage.get('sliderSeen').then(function (value) {
          if (
            value &&
            (value.pageId == Fliplet.Env.get('pageId') ||
              value.pageMasterId == Fliplet.Env.get('pageMasterId'))
          ) {
            Fliplet.Navigate.screen(thisSlider.fields.redirectEndScreen);
          } else {
            Fliplet.App.Storage.set('sliderSeen', {
              pageId: Fliplet.Env.get('pageId'),
              pageMasterId: Fliplet.Env.get('pageMasterId')
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
      $(container).find('[data-name="slide"]').addClass('swiper-slide')
      // $('.skip-container').toggle(!thisSlider.fields.skipEnabled.includes(false));

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
        loop: this.fields.loopSlides.includes(true),
        // direction: this.fields.NavDirection,
        effect: this.fields.AnimationStyle,
        allowSlideNext: true,
        allowSlidePrev: true,
        autoHeight: true,
        keyboard: {
          enabled: true,
          onlyInViewport: false
        }
      };
      /*if (this.fields.NavDirection == 'vertical') {
        swiperOptions.autoHeight = true;
        swiperOptions.height = Math.round(window.innerHeight) + 150;
      }*/
      if (this.fields.AnimationStyle == 'fade') {
        swiperOptions.fadeEffect = {
          crossFade: true
        };
      }

      if (!this.fields.Arrows && (Fliplet.Env.get('platform') == 'native' || $('.fl-page-content-wrapper').innerWidth() < 600)) {
        $('.swiper-button-next').hide();
        $('.swiper-button-prev').hide();
        swiperOptions.allowTouchMove = true;
      }
      swiper = new Swiper(container, swiperOptions);
      const autoheightIntervalInstance = setInterval(myTimer, 1000);
      function myTimer() {
        swiper.updateAutoHeight(500);
      }
      function stopAutoheightInterval() {
        clearInterval(autoheightIntervalInstance);
      }
      $(window).bind('beforeunload', function () {
        return stopAutoheightInterval();
      });

      var firstSlide = slides[0];
      if (firstSlide.fields.requiredForm) {
        if (firstSlide.fields.requiredFormBackwardNavigation) {
          swiper.allowSlidePrev = false;
        } else {
          swiper.allowSlidePrev = true;
        }
        if (firstSlide.fields.requiredFormForwardNavigation) {
          swiper.allowSlideNext = false;
        } else {
          swiper.allowSlideNext = true;
        }
      }
      if (Fliplet.FormBuilder) {
        Fliplet.FormBuilder.getAll()
          .then(function (forms) {
            var formId = $($('[data-name="slide"].swiper-slide-active').find('[data-name="Form"]')).attr(
              'data-id'
            );
            if (formId) {
              thisSlider.data.formName = forms.find(el => el.instance.id == formId).name;
            } else {
              thisSlider.data.formName = null;
            }
          })
          .then(function () {
            // Load form
            return Fliplet.App.Storage.get(thisSlider.data.formName).then(function (value) {
              if (value) {
                return Fliplet.DataSources.connect(value.dataSourceId).then(function (
                  connection
                ) {
                  return connection.findById(value.entryId).then(function (record) {
                    if (record) {
                      return Fliplet.FormBuilder.get().then(function (form) {
                        form.load(record)
                      });
                    }
                  });
                });
              }
            });
            // return Fliplet.App.Storage.get(thisSlider.data.formName).then(function (value) {
            //   if (value) {
            //     return Fliplet.FormBuilder.get().then(function (form) {
            //       form.load(function () {
            //         return Fliplet.DataSources.connect(value.dataSourceId).then(function (
            //           connection
            //         ) {
            //           return connection.findById(value.entryId)
            //         });
            //       });
            //     });
            //   }
            // });
          });
      }
      vm.swiper = swiper;
      swiper.on('slideChange', function () {
        thisSlider.data.formName = null;
        if (Fliplet.FormBuilder) {
          Fliplet.FormBuilder.getAll()
            .then(function (forms) {
              var formId = $(
                $('[data-name="slide"].swiper-slide-active').find('[data-name="Form"]')
              ).attr('data-id');
              if (formId) {
                thisSlider.data.formName = forms.find(el => el.instance.id == formId).name;
              } else {
                thisSlider.data.formName = null;
              }
            })
            .then(function () {
              // Load form
              // return Fliplet.App.Storage.get(thisSlider.data.formName).then(function (value) {
              //   if (value) {
              //     return Fliplet.FormBuilder.get().then(function (form) {
              //       form.load(function () {
              //         return Fliplet.DataSources.connect(value.dataSourceId).then(function (
              //           connection
              //         ) {
              //           return connection.findById(value.entryId);
              //         });
              //       });
              //     });
              //   }
              // });
              return Fliplet.App.Storage.get(thisSlider.data.formName).then(function (value) {
                if (value) {
                  return Fliplet.DataSources.connect(value.dataSourceId).then(function (
                    connection
                  ) {
                    return connection.findById(value.entryId).then(function (record) {
                      if (record) {
                        return Fliplet.FormBuilder.get().then(function (form) {
                          form.load(record)
                        });
                      }
                    });
                  });
                }
              });
            });
        }

        var currentSlide = slides[swiper.realIndex];
        if (currentSlide && currentSlide.fields.requiredForm) {
          if (currentSlide.fields.requiredFormBackwardNavigation) {
            this.allowSlidePrev = false;
          } else {
            this.allowSlidePrev = true;
          }
          if (currentSlide.fields.requiredFormForwardNavigation) {
            this.allowSlideNext = false;
          } else {
            this.allowSlideNext = true;
          }
        }

        Fliplet.Page.scrollTo(vm.$el);
      });

      vm.showNav = true;
      vm.toggleNav = function (toggle) {
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
      vm.togglePrevNav = function (toggle) {
        if (typeof toggle === 'undefined') {
          toggle = vm.$el.hasClass('swiper-nav-prev-disabled');
        }

        vm.$el[toggle ? 'removeClass' : 'addClass']('swiper-nav-prev-disabled');
        vm.swiper.allowSlidePrev = !!toggle;
        vm.swiper.update();
      };
      vm.toggleNextNav = function (toggle) {
        if (typeof toggle === 'undefined') {
          toggle = vm.$el.hasClass('swiper-nav-next-disabled');
        }

        vm.$el[toggle ? 'removeClass' : 'addClass']('swiper-nav-next-disabled');
        vm.swiper.allowSlideNext = !!toggle;
        vm.swiper.update();
      };
      vm.slidePrev = function () {
        swiper.slidePrev.apply(swiper, arguments);
      };
      vm.slideNext = function () {
        swiper.slideNext.apply(swiper, arguments);
      };
      vm.slideTo = function () {
        swiper.slideTo.apply(swiper, arguments);
      };
      vm.getActiveSlide = function () {
        return vm.children('slide')[swiper.activeIndex];
      };

      Fliplet.Hooks.run('sliderInitialized');

      Fliplet.Hooks.on('beforeFormSubmit', function (formData) {
        return Fliplet.App.Storage.get(thisSlider.data.formName).then(function (value) {
          if (value) {
            return Fliplet.DataSources.connect(value.dataSourceId).then(function (connection) {
              return connection.update(value.entryId, formData).then(() => {
                swiper.slideNext();
                return Promise.reject('')
              })
            });
          }
        })
      });

      Fliplet.Hooks.on('afterFormSubmit', function (response) {
        swiper.allowSlideNext = true;
        swiper.allowSlidePrev = true;
        if (thisSlider.data.formName) {
          Fliplet.App.Storage.set(thisSlider.data.formName, {
            entryId: response.result.id,
            dataSourceId: response.result.dataSourceId
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
        placeholder: '<div class="well text-center">Add Slide components to build your slider</div>',
        allow: ['slide']
      }
    ]
  }
});
// });
