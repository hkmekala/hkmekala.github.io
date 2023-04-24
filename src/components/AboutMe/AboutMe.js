import * as React from 'react';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import { Typography } from '@mui/material';

function AboutMe(payload) {

    const { greeting, about } = payload.payload;
    const aboutMe = about.map((element, key) => (<Typography key={key} variant="body1" sx={{
        m: '2rem',
        mr: 2,
        ml: 2,
        display: { md: 'flex' },
        fontFamily: 'monospace',
        fontWeight: 400,
        letterSpacing: '.1rem',
        color: 'inherit',
        textDecoration: 'none',
        textAlign: 'right',
    }} gutterBottom>
        {element}
    </Typography>));

    return (
        <Container maxWidth="md" sx={{ alignItems: 'stretch', height: 'auto'}}>
        <Box sx={{ visibility: 'visible', alignItems: 'stretch'}} m={1}>
                <Typography variant="h5" component="div" sx={{
                    m: '2rem',
                    mr: 2,
                    ml: 2,
                    display: { md: 'flex' },
                    fontFamily: 'monospace',
                    fontWeight: 700,
                    letterSpacing: '.3rem',
                    color: 'inherit',
                    textDecoration: 'none',
                    textAlign: 'right',
                    alignItems: 'stretch'
                }}>
                    {greeting}
                </Typography>
                {aboutMe}
        </Box>
      </Container>
    );
}

export default AboutMe;