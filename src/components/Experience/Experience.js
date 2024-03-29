import * as React from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import { List, ListItem, Button, Stack } from '@mui/material';




function Experience(payload) {
    const {type, time, role, description, companyName, tech } = payload.job;
    const descriptionComponents = description.map((element) => (
      <ListItem key={element} variant="body2" sx={{fontFamily: 'monospace', fontWeight: 'light', lineHeight:1, display:'list-item' }}>
      {element}
      <br />
    </ListItem>
    ));

    const techStack = tech.map((element) => (
      <Button variant="outlined" size="small" key={element} disableElevation>{element}</Button>
    ));

    return (
        <Card sx={{ minWidth: 275 }}>
        <CardContent>
          <Typography sx={{ fontSize: 14, fontFamily: 'monospace' }} color="text.secondary" gutterBottom>
          {type + ' | ' + time}
          </Typography>
          <Typography variant="h5" component="div" sx={{fontFamily: 'monospace'}}>
          {companyName}
          </Typography>
          <Typography sx={{ mb: 1.5, fontFamily: 'monospace' }} color="text.secondary">
          {role}
          </Typography>
          <Stack spacing={1} direction="row">
          {techStack}
          </Stack>  
          <List>
          {descriptionComponents}
          </List>
        </CardContent>
      </Card>
    );
}

export default Experience;