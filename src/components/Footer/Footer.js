import React from "react";
import { Box, Typography } from "@mui/material";

export const Footer= () => {
  return (
    <div style={{width: '100%'}}>        
        <Box component="div" sx={{display: 'inline'}} >
        <Typography sx={{textAlign: 'right', fontFamily: 'monospace'}}>
        {`${new Date().getFullYear()}`} - {`©`} - {`All Rights Reserved`}
        </Typography>
        </Box>        
    </div>
  );
};

export default Footer;