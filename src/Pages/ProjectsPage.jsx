import { useNavigate } from "react-router-dom";
import Hero from "../Components/Hero";


function ProjectsPage() {
    const navigate = useNavigate();

    return (
        <>
            <Hero img="project" title={<><span>Start Designing your own project</span><br /></>} btn="New Project" onclick={() => { navigate("/designOne"); }} />
        </>
    )
}

export default ProjectsPage