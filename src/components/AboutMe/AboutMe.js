import * as React from 'react';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import { Stack, Typography, Button } from '@mui/material';
import { GitHub, LinkedIn, Twitter, PictureAsPdf } from '@mui/icons-material';

function AboutMe(payload) {

    const { greeting, about, social } = payload.payload;
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
                <Stack spacing={0} direction="row">
                    <Button startIcon={<GitHub />} size="large" href={social.github} target="_blank"></Button>
                    <Button startIcon={<LinkedIn />} size="large" href={social.linkedin} target="_blank"></Button>
                    <Button startIcon={<Twitter />} size="large" href={social.twitter} target="_blank"></Button>
                    <Button startIcon={<PictureAsPdf />} size="large" href={social.resume} target="_blank"></Button>
                </Stack>
            {aboutMe}
        </Box>
      </Container>
    );
}

export default AboutMe;