import { AppBar, Avatar, Toolbar, Typography } from "@mui/material";
import React from "react";

function Header(payload) {

  const {name, profilePic} = payload.payload;

  return (
        <React.Fragment>
        <AppBar position="fixed">
          <Toolbar disableGutters sx={{
            justifyContent: 'flex-end',
            gradient: 'linear-gradient(45deg, #FE6B8B 30%, #FF8E53 90%)',
            boxShadow: '0 3px 5px 2px rgba(255, 105, 135, .3)',
          }}>
           <Avatar sx={{
                ml: 2,
                mr: 2,
            }} alt={name} src={profilePic} />
            <Typography
            variant="h4"
            noWrap
            href="/"
            sx={{
              mr: 2,
              ml: 2,
              display: { xs: 'none', md: 'flex' },
              fontFamily: 'monospace',
              fontWeight: 700,
              letterSpacing: '.3rem',
              color: 'inherit',
              textDecoration: 'none',
              textAlign: 'right'
            }}
            >
                {name}</Typography>
          </Toolbar>
        </AppBar>
        <Toolbar />
      </React.Fragment>
  );
}

export default Header;