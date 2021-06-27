/**
 * Author and copyright: Stefan Haack (https://shaack.com)
 * Repository: https://github.com/shaack/bootstrap-cookie-banner
 * License: MIT, see file 'LICENSE'
 */

function BootstrapCookieConsent(props) {
  var logText;
  var current_page;
  var whitelisted;
  var logger                = log4javascript.getLogger('j1.core.bsCookieConsent');
  var modalId               = "bccs-modal"
  var self                  = this
  var detailedSettingsShown = false

  this.props = {
    autoShowDialog:         true,                                               // disable autoShowModal on the privacy policy and legal notice pages, to make these pages readable
    language:               navigator.language,                                 // the language, in which the modal is shown
    languages:              ["en", "de"],                                       // supported languages (in ./content/), defaults to first in array
    contentURL:             "./content",                                        // this URL must contain the dialogs content in the needed languages
    cookieName:             "j1.cookie.consent",                                // the name of the cookie in which the configuration is stored as JSON
    cookieStorageDays:      365,                                                // the duration the cookie configuration is stored on the client
    whitelisted:            [],                                                 // pages NO consent modal page is issued
    xhr_data_element:       "",
    postSelectionCallback:  undefined                                           // callback function, called after the user has made his selection
  }

  for (var property in props) {
    // noinspection JSUnfilteredForInLoop
    this.props[property] = props[property];
  }

  this.language = this.props.language
  if (this.language.indexOf("-") !== -1) {
    this.language = this.language.split("-")[0];
  }

  if (!this.props.languages.includes(this.language)) {
    this.language = this.props.languages[0];                                    // fallback on default language
  }

  var Cookie = {
    set: function (name, value, days) {
      var expires = "";
      if (days) {
        var date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = "; expires=" + date.toUTCString();
      }
      document.cookie = name + "=" + (value || "") + expires + "; Path=/; SameSite=Strict;";
    },
    get: function (name) {
    var nameEQ = name + "=";
    var ca = document.cookie.split(';');
    for (var i = 0; i < ca.length; i++) {
      var c = ca[i];
      while (c.charAt(0) === ' ') {
        c = c.substring(1, c.length);
      }
      if (c.indexOf(nameEQ) === 0) {
        return c.substring(nameEQ.length, c.length);
      }
    }
    return undefined
    }
  }

  var Events = {
    documentReady: function (onDocumentReady) {
      if (document.readyState !== 'loading') {
        onDocumentReady();
      } else {
        document.addEventListener('DOMContentLoaded', onDocumentReady);
      }
    }
  }

  function showDialog() {
    Events.documentReady(function () {
      this.modal = document.getElementById(modalId);
      if (!self.modal) {
        self.modal = document.createElement("div");
        self.modal.id = modalId;
        self.modal.setAttribute("class", "modal fade");
        self.modal.setAttribute("tabindex", "-1");
        self.modal.setAttribute("role", "dialog");
        self.modal.setAttribute("aria-labelledby", modalId);
        document.body.append(self.modal);
        self.$modal = $(self.modal);

        if (self.props.postSelectionCallback) {
          self.$modal.on("hidden.bs.modal", function () {
            self.props.postSelectionCallback();
          });
        }

        // load modal content
        //
        var templateUrl = self.props.contentURL + '/' + 'index.html';
        $.get(templateUrl)
        .done(function (data) {
          self.modal.innerHTML = data;
          self.modal.innerHTML = $('#' + self.props.xhr_data_element).eq(0).html();

          $(self.modal).modal({
            backdrop: "static",
            keyboard: false
          });

          self.$buttonDoNotAgree = $("#bccs-buttonDoNotAgree");
          self.$buttonAgree = $("#bccs-buttonAgree");
          self.$buttonSave = $("#bccs-buttonSave");
          self.$buttonAgreeAll = $("#bccs-buttonAgreeAll");

          updateButtons();
          updateOptionsFromCookie();

          $("#bccs-options").on("hide.bs.collapse", function () {
            detailedSettingsShown = false;
            updateButtons();
          }).on("show.bs.collapse", function () {
            detailedSettingsShown = true;
            updateButtons();
          });
          self.$buttonDoNotAgree.click(function () {
            doNotAgree();
          });
          self.$buttonAgree.click(function () {
            agreeAll();
            location.reload();
          });
          self.$buttonSave.click(function () {
            saveSettings();
            location.reload();
          });
          self.$buttonAgreeAll.click(function () {
            agreeAll();
            location.reload();
          });
        })
        .fail(function () {
          logger.error('You probably need to set `contentURL` in the props');
        })
      } else {
        self.$modal.modal("show")
      }
    }.bind(this))
  }

  function updateOptionsFromCookie() {
    var settings = self.getSettings();
    if (settings) {
      for (var setting in settings) {
        var $checkbox = self.$modal.find("#bccs-options .bccs-option[data-name='" + setting + "'] input[type='checkbox']");
        // noinspection JSUnfilteredForInLoop
        $checkbox.prop("checked", settings[setting]);
      }
    }
  }

  function updateButtons() {
    if (detailedSettingsShown) {
      self.$buttonDoNotAgree.hide();
      self.$buttonAgree.hide();
      self.$buttonSave.show();
      self.$buttonAgreeAll.show();
    } else {
      self.$buttonDoNotAgree.show();
      self.$buttonAgree.show();
      self.$buttonSave.hide();
      self.$buttonAgreeAll.hide();
    }
  }

  function gatherOptions(setAllExceptNecessary) {
    var $options = self.$modal.find("#bccs-options .bccs-option");
    var options = {};
    for (var i = 0; i < $options.length; i++) {
      var option = $options[i];
      var name = option.getAttribute("data-name");
      if (name === "necessary") {
        options[name] = true;
      } else if (setAllExceptNecessary === undefined) {
        var $checkbox = $(option).find("input[type='checkbox']");
        options[name] = $checkbox.prop("checked");
      } else {
        options[name] = !!setAllExceptNecessary;
      }
    }
    return options
  }

  function agreeAll() {
    Cookie.set(self.props.cookieName, JSON.stringify(gatherOptions(true)), self.props.cookieStorageDays);
    self.$modal.modal("hide");
  }

  function doNotAgree() {
    Cookie.set(self.props.cookieName, JSON.stringify(gatherOptions(false)), self.props.cookieStorageDays);
    logger.warn('delete cookie consent');
    j1.deleteCookie("j1.user.consent");
    self.$modal.modal("hide")
    j1.goHome();
//  window.home();
//  location.href = "about:home";
  }

  function saveSettings() {
    Cookie.set(self.props.cookieName, JSON.stringify(gatherOptions()), self.props.cookieStorageDays);
    self.$modal.modal("hide");
  }

  // call consent dialog if no cookie found (except pages whitelisted)
  //
  whitelisted  = (this.props['whitelisted'].indexOf("window.location.pathname") > -1);
  if (Cookie.get(this.props.cookieName) === undefined && this.props.autoShowDialog && !whitelisted) {
    showDialog();
  }

  // API functions
  // -------------------------------------------------------------------------

  // show the consent dialog (modal)
  // -------------------------------------------------------------------------
  this.showDialog = function () {
    whitelisted = (this.props['whitelisted'].indexOf(window.location.pathname) > -1);
    if (!whitelisted) { showDialog(); }
  }

  // collect settings from consent cookie
  // -------------------------------------------------------------------------
  this.getSettings = function (optionName) {
    var cookie = Cookie.get(self.props.cookieName);
    if (cookie) {
      var settings = JSON.parse(Cookie.get(self.props.cookieName));
      if (optionName === undefined) {
          return settings;
      } else {
        if (settings) {
          return settings[optionName];
        } else {
          return false;
        }
      }
    } else {
      return undefined;
    }
  }
}