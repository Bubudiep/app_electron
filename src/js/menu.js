module.exports = function(actions) {
  return [
      {
          label: "Foo",
          submenu: [
              { label: "Bar", click: actions.bar },
              { label: "About", click: actions.about }
          ]
      }
  ];
}