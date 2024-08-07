import { Grid } from "@mui/material";
import React from "react";
import Header from "../Header/Header";
import WorkTimeline from "../Timeline/WorkTimeline";
import AboutMe from "../AboutMe/AboutMe";
import Footer from "../Footer/Footer";
import config from '../../data/config.json';
import PandaImage from "./PandaImage";



function Landing() {
	const { jobs, about, social, greeting, name, profilePic, panda } = config;

	return (
		<div className="Landing">
			<Header payload={{name, profilePic}}></Header>
			<Grid container spacing={2} justifyContent={"flex-start"}>
				<Grid item sx={{display: 'flex'}} xs={12} md={6} lg={6}>
					<AboutMe payload={{greeting, about, social}}></AboutMe>							
				</Grid>
				<PandaImage imageUrl={panda} />
				<Grid item sx={{display: 'flex'}} xs={12} sm={12} lg={12}>
					<WorkTimeline jobs={jobs}></WorkTimeline>
				</Grid>
			</Grid>
			
			<Footer></Footer>
		</div>
	);
}

export default Landing;
