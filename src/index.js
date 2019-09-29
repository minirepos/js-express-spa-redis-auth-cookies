import React, { useState } from 'react'

import axios from 'axios'
// At the moment, useAxios caches everything so a page reload is necessary
// to see different results after logging in / out.
// https://github.com/simoneb/axios-hooks/issues/33
import useAxios from 'axios-hooks'
import { render } from 'react-dom'
import { BrowserRouter as Router, Switch, Route, Link } from 'react-router-dom'

// Change the URL for staging / production
axios.defaults.baseURL = 'http://localhost:8000'
axios.defaults.withCredentials = true

const Nav = () => {
  const [{ data: user }, refetchUser] = useAxios('/me')
  const [email, setEmail] = useState('')

  const loginHandler = async () => {
    try {
      await axios(`/login/${email}`)
      refetchUser()
    } catch (err) {
      err.response.status === 401 && alert('User does not exist, use sven@example.com')
    }
  }

  const logoutHandler = async () => {
    await axios('/logout')
    refetchUser()
  }

  return (
    <div>
      <nav>
        <ul>
          <li>
            <Link to="/">Home</Link>
          </li>
          <li>
            <Link to="/public">Public</Link>
          </li>
          <li>
            <Link to="/private">Private</Link>
          </li>
        </ul>
      </nav>
      {user ? (
        <>
          Logged in as {user.name} ({user.email}) <button onClick={logoutHandler}>Log out</button>
        </>
      ) : (
        <form onSubmit={e => e.preventDefault()}>
          <input
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="sven@example.com"
            required
          />
          <button type="submit" onClick={loginHandler}>
            Log in
          </button>
        </form>
      )}
    </div>
  )
}

const PublicPage = () => {
  const [{ data }] = useAxios('/public-data')
  return data ? JSON.stringify(data) : 'Loading...'
}

const PrivatePage = () => {
  const [{ data, error }] = useAxios('/private-data')

  if (error && error.response.status === 401) return 'You must be logged in to view this page'

  return data ? JSON.stringify(data) : 'Loading...'
}

const App = () => (
  <Router>
    <div>
      <Nav />
      <hr />
      <Switch>
        <Route path="/public">
          <PublicPage />
        </Route>
        <Route path="/private">
          <PrivatePage />
        </Route>
      </Switch>
    </div>
  </Router>
)

render(<App />, document.getElementById('root'))
