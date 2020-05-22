import React, { Fragment } from 'react';
import { Link } from 'react-router-dom';
import { connect } from 'react-redux';
import { logout } from '../../actions/auth';
import PropTypes from 'prop-types';

const Navbar = ({ auth: { isAuthenticated, loading }, logout }) => {
  const authLinks = (
    <ul>
      <li>
        <Link to='/posts'>Posts</Link>
      </li>
      <li>
        <Link to='/profiles'>Developers</Link>
      </li>
      <li>
        <Link to='/dashboard'>
          <i className='fas fa-user'></i> Dashboard
        </Link>
      </li>
      <li>
        <Link onClick={logout} to='#!'>
          <i className='fas fa-sign-out-alt'></i> Logout
        </Link>
      </li>
    </ul>
  );

  const guestLink = (
    <ul>
      <li>
        <Link to='/profiles'>Developers</Link>
      </li>
      <li>
        <Link to='/register'>Register </Link>
      </li>
      <li>
        <Link to='/login'>Login </Link>
      </li>
    </ul>
  );
let condition = !loading && isAuthenticated;
  return (
    <nav className='navbar bg-dark'>
      <h1>
        <Link to='/'>
          <i className='fas fa-code'></i> DevConnector
        </Link>
      </h1>
    <div className={condition ? "" : "d-none"}>
    {authLinks}
    </div>
    <div className={condition ? "d-none" : ""}>
    {guestLink}
    </div>
{/*       
      {!loading && (
        <Fragment>{isAuthenticated ? authLinks : guestLink}</Fragment>
      )} */}
    </nav>
  );
};

Navbar.propTypes = {
  logout: PropTypes.func.isRequired,
  auth: PropTypes.object.isRequired,
};

const mapStateToProps = (state) => ({
  auth: state.auth,
});

export default connect(mapStateToProps, { logout })(Navbar);
