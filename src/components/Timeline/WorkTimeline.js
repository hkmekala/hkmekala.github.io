import * as React from 'react';
import Timeline from '@mui/lab/Timeline';
import TimelineItem from '@mui/lab/TimelineItem';
import TimelineSeparator from '@mui/lab/TimelineSeparator';
import TimelineConnector from '@mui/lab/TimelineConnector';
import TimelineContent from '@mui/lab/TimelineContent';
import TimelineDot from '@mui/lab/TimelineDot';
import Experience from '../Experience/Experience';
import { TimelineOppositeContent } from '@mui/lab';

function WorkTimeline(jobs) {
  const timeLine = jobs.jobs.map((job, key) => {
    return (<TimelineItem key={key} position='right'>
    <TimelineOppositeContent display={'none'}></TimelineOppositeContent>
    <TimelineSeparator>
      <TimelineDot />
      <TimelineConnector />
    </TimelineSeparator>
    <TimelineContent><Experience job={job} /></TimelineContent>
  </TimelineItem>);
  });

  return (
    <Timeline>
      {timeLine}
    </Timeline>
  );
}

export default WorkTimeline;