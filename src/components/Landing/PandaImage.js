import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types'; // For prop validation
import { Grid, Box } from '@mui/material';

function PandaImage({ imageUrl }) {
  const [isLoading, setIsLoading] = useState(true);
  const imageRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          const img = new Image();
          img.src = imageUrl; // Use the prop
          img.onload = () => setIsLoading(false);
          observer.unobserve(imageRef.current);
        }
      },
      {
        rootMargin: '200px',
        threshold: 0.25,
      }
    );

    if (imageRef.current) {
      observer.observe(imageRef.current);
    }

    return () => {
      if (imageRef.current) {
        observer.unobserve(imageRef.current);
      }
    };
  }, [imageUrl]); // Add imageUrl to dependency array

  return (
    <Grid item sx={{ display: 'flex' }} xs={12} md={6} lg={6}>
      <Box
        ref={imageRef}
        sx={{
          height: 'auto',
          width: '100%',
          background: isLoading ? 'lightgray' : `url(${imageUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          transition: 'background-image 5s ease-in-out',
        }}
        alt="Panda"
      />
    </Grid>
  );
}

// Prop Validation
PandaImage.propTypes = {
  imageUrl: PropTypes.string.isRequired,
};

export default PandaImage;
