import AboutCard from "../Cards/aboutCard"


function AboutContent() {
    return (
        <div className=" py-16 bg-[#f3f9fb]">
            <div className="w-11/12 mx-auto flex items-center  justify-center lg:justify-between gap-8">

                <AboutCard title="Mission" descr="That dominion stars lights dominion divide years for fourth have don&apos;t
          stars is that he earth it first without heaven in place seed it second
          morning saying."/>
                <AboutCard title="Design" descr="That dominion stars lights dominion divide years for fourth have don&apos;t
          stars is that he earth it first without heaven in place seed it second
          morning saying."/>



                <div className="w-full sm:w-[45%] lg:w-[30%] text-center sm:text-left">
                    <h2 className="text-2xl font-semibold">Values</h2>
                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-2 my-2">
                        <i className="fas fa-caret-right text-[#C19A6B]" />
                        <p>Innovation and creativity in every project</p>
                    </div>
                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-2 my-2">
                        <i className="fas fa-caret-right text-[#C19A6B]" />
                        <p>Commitment to quality and excellence</p>
                    </div>
                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-2 my-2">
                        <i className="fas fa-caret-right text-[#C19A6B]" />
                        <p>Integrity and transparency in all dealings</p>
                    </div>
                </div>
            </div>
        </div>

    )
}

export default AboutContent