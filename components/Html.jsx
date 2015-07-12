
var React = require('react');

var Html = React.createClass({
  render: function() {
    return (
      <html>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link href='http://fonts.googleapis.com/css?family=Open+Sans:700,300,800,400' rel='stylesheet' type='text/css' />
        <link href='http://fonts.googleapis.com/css?family=Quicksand:300,400,700' rel='stylesheet' type='text/css' />
        <link href="https://cdnjs.cloudflare.com/ajax/libs/skeleton/2.0.4/skeleton.css" rel="stylesheet" />
        <link rel="stylesheet" href="//maxcdn.bootstrapcdn.com/font-awesome/4.3.0/css/font-awesome.min.css" />
        <link href="/bundle.css" rel="stylesheet" />
        <body>
          <div id="main" dangerouslySetInnerHTML={{__html: this.props.html}}></div>
          <script src="/bundle.js" />
          <script dangerouslySetInnerHTML={{__html: this.props.script}}></script>
        </body>
      </html>);
  }
});

module.exports = Html;
