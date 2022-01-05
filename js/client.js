/* global TrelloPowerUp */

TrelloPowerUp.initialize({
  'list-actions': function (t) {
    return t.list('name', 'id', 'cards')
    .then(function (list) {
      return [{
        text: "Generate Release Notes",
        callback: function (t) {

          t.modal({
            url: './release-notes.html',
            fullscreen: true,
            title: 'Generate Release Notes',
            args: { releaseNotesList: list }
          })
        }
      }];
    });
  }
});
