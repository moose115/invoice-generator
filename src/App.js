import React from 'react';
import { createGlobalStyle } from 'styled-components';
import Form from './comps/form';

const GlobalStylesheet = createGlobalStyle`
* {
  box-sizing: inherit;
}
html, body {
	margin: 0;
	padding: 0;
	box-sizing: border-box;
	font-family: sans-serif;
}
body {
  background: #282c34;
}
`

function App() {
  return (
    <>
      <GlobalStylesheet />
      <Form />
    </>
  );
}

export default App;
