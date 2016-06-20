//////////////////
//SOURCE SCHEMA///
//////////////////
'use strict';
var mongoose = require('mongoose');
require('mongoose-html-2').loadType(mongoose);

var aboutPageSchema, AboutPage,
    Schema          = mongoose.Schema,
    ObjectId        = Schema.Types.ObjectId,
    HTML            = mongoose.Types.Html,
    htmlSettings    = {
        type: HTML,
        setting: {
            allowedTags: [ 'h1', 'h2','h3', 'h4', 'h5', 'h6', 'blockquote', 'p', 'a', 'ul', 'ol',
                'nl', 'li', 'b', 'i','u', 'strong', 'em', 'strike', 'code', 'hr', 'br', 'div',
                'table', 'thead', 'caption', 'tbody', 'tr', 'th', 'td', 'pre','img','pre','strike'],
            allowedAttributes: {

                '*': [ 'href', 'align', 'alt', 'center', 'bgcolor','style' ],
                a: [ 'href', 'name', 'target' ],
                img: [ 'src','class']
            },
            selfClosing: [ 'img', 'br', 'hr', 'area', 'base', 'basefont', 'input', 'link', 'meta' ],
            allowedSchemes: [ 'http', 'https', 'ftp', 'mailto' ],
            allowedSchemesByTag: {}
        }
    };

aboutPageSchema = new Schema({
    about_text: htmlSettings
});

AboutPage = mongoose.model('AboutPage', aboutPageSchema);

function createDefaultAboutPage() {
    AboutPage.find({}).count().exec(function(err, about_page_count) {
        if(about_page_count === 0) {
            AboutPage.create({_id:"57639b9e2b50bbd70c2ff252",about_text:'<div><h1>About</h1></div><p>Across the world, governments and companies are involved in natural resource projects, generating billions of dollars. The Natural Resource Governance Institute (NRGI) works to help people to realize the benefits of the endowments of oil, gas and minerals in their countries. Transparency is an important part of this, and new regulations are coming into force around the world to encourage greater project-level disclosure of extractives activities and revenues.</p><p>ResourceProjects.org is a prototype platform to bring together data on individual extractives projects.</p><h2 id="why-project-level-data-matters">Why project level data matters</h2><p>Projects represent the physical, tangible presence of extractive operations in a country. The project is the mine that people see out of their window, or the oil field along their coastline. It has a location, an owner, and it employs people. Each projects is tied to a contract, or license.</p><p>Governments and citizens groups alike can use project data to model resource project revenues and consequently forecast budgets, such as<a href="http://www.resourcegovernance.org/news/blog/forecasting-ghanas-oil-revenues-what-open-fiscal-modelling-tells-us-about-budget-year-ahea"> in Ghana</a> where all interested parties can see how different oil prices affect the money available for the budget. Others, such as <a href="http://ccsi.columbia.edu/work/projects/open-fiscal-models/">CCSI</a>, <a href="http://www.globalwitness.org/ugandaoilcontracts/">Global Witness</a>, and <a href="https://openoil.net/contract-modeling/"> Open Oil</a> have modeled contracts to evaluate extractive deals, while IMF economists routinely use project-level information for fiscal design and technical assistance using their  <a href="http://www.imf.org/external/np/fad/fari/">publicly available FARI model</a>. Project information has a multitude of applications beyond fiscal modeling. It can be tied to spatial data to help better understand local impacts or environmental consequences, as highlighted by recent <a href="http://www.annualreviews.org/doi/abs/10.1146/annurev-resource-100814-125106">academic</a> <a href="http://www.theigc.org/wp-content/uploads/2014/09/Aragon-Rud-2013-Working-Paper.pdf">papers</a>.</p><h2 id="why-we-are-building-this-tool">Why we are building this tool</h2><p>Information on extractive projects are scattered across  different company and government websites, databases compiled by regulators, international organizations, industry and civil society. Some of it is in PDF,  some in spreadsheets and some is in computer queryable databases, but these are rarely linked to each other at all.</p><p>This repository allows to bring these different information together in one place. Our aim is to enrich the project level payment data harvested from mandatory disclosures with additional contextual information on projects:</p><ul><li>Name and aliases of project</li><li>Project type, status, commodity, location</li><li>Production volumes, reserves</li><li>Associated companies</li><li>Associated contracts</li><li>Associated concessions</li><li>Associated fields and sites</li><li>Detailed provenance</li></ul><p>We are also working on linking the data gathered to existing repositories on related entities, such as OpenCorporates for associated companies, ResourceContracts for oil and mining contracts and Open Oil`s concession map. All of the information on the platform is stored with details on what source it came from and how it was retrieved.</p><p>By bringing this information together in a standardized and accessible format, we allowing to explore extractive projects with greater depth.</p><h2 id="road-map">Road map</h2><p>We are working on adding the following features to the site:</p><ul><li>An automated query which will import UK mandatory payment disclosures onto ResourceProjects.org as they are published throughout April and May</li><li>A payment page where project level disclosure can be browsed by source</li><li>Bulk download of data stored on the site</li><li>An API endpoint which will allow programmable querying of the database</li><li>Sort and search features to better navigate through the repository</li><li>Refining how additional data can be added to the site</li><li>Refinement of project verification methodology</li></ul><h2 id="how-to-get-involved">How to get involved?</h2><p>We are now looking for people who might be interested in getting involved in the site. We are inviting feedback and contributions to the site and its content. Further features and enhancements will be rolled out in the coming weeks and we are looking for content partners who can help contribute additional data on specific countries and projects. Further we would welcome any organisations or individuals who wish to lead on specific countries from upcoming mandatory disclosures (beyond UK and Norway).</p><p>If you would be interested please get in touch:</p><ul><li>Email:<a href="mailto:dmihalyi@resourcegovernance.org?Subject=Resource%20Projects%20inquiry" target="_top"> David Mihalyi</a></li><li>Join the<a href="https://groups.google.com/forum/#!forum/resourceprojects"> google group</a></li><li>Submit feedback on<a href="https://github.com/NRGI/rp-org-frontend"> GitHub</a></li></ul><p></p><h2 id="acknowledgements">Acknowledgements</h2><p>ResourceProjects.org was developed by NRGI with external support.</p><p>We would like to thank<a href="http://www.opendataservices.coop/"> Open Data Services</a>,<a hfref="http://openoil.net/"> Open Oil</a>, and<a href="http://smartlane.de/"> Smartlane</a> for their valued contributions to the site.  We would also like to thank the following contributors to the data: Bence Kiss-Dobronyi, Min Lee, Manuel Llano, Julio Lopez and  Joseph Thiel.</p>'});
           } else {
            console.log(String(about_page_count), 'about page exist...')
        }
    });
};

exports.createDefaultAboutPage = createDefaultAboutPage;