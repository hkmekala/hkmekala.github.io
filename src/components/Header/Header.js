import { AppBar, Avatar, Toolbar, Typography } from "@mui/material";
import React from "react";

function Header(payload) {

  const {name, profilePic} = payload.payload;

  return (
        <React.Fragment>
        <AppBar position="fixed">
          <Toolbar disableGutters sx={{
            justifyContent: 'flex-end',
            background: 'rgba(9, 14, 30, 0.82)',
            backdropFilter: 'blur(8px)',
            borderBottom: '1px solid rgba(94, 234, 212, 0.2)',
            boxShadow: '0 10px 30px rgba(2, 6, 23, 0.45)',
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