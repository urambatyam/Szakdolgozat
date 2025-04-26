'use strict';

customElements.define('compodoc-menu', class extends HTMLElement {
    constructor() {
        super();
        this.isNormalMode = this.getAttribute('mode') === 'normal';
    }

    connectedCallback() {
        this.render(this.isNormalMode);
    }

    render(isNormalMode) {
        let tp = lithtml.html(`
        <nav>
            <ul class="list">
                <li class="title">
                    <a href="index.html" data-type="index-link">athena documentation</a>
                </li>

                <li class="divider"></li>
                ${ isNormalMode ? `<div id="book-search-input" role="search"><input type="text" placeholder="Type to search"></div>` : '' }
                <li class="chapter">
                    <a data-type="chapter-link" href="index.html"><span class="icon ion-ios-home"></span>Getting started</a>
                    <ul class="links">
                        <li class="link">
                            <a href="overview.html" data-type="chapter-link">
                                <span class="icon ion-ios-keypad"></span>Overview
                            </a>
                        </li>
                        <li class="link">
                            <a href="index.html" data-type="chapter-link">
                                <span class="icon ion-ios-paper"></span>README
                            </a>
                        </li>
                                <li class="link">
                                    <a href="dependencies.html" data-type="chapter-link">
                                        <span class="icon ion-ios-list"></span>Dependencies
                                    </a>
                                </li>
                                <li class="link">
                                    <a href="properties.html" data-type="chapter-link">
                                        <span class="icon ion-ios-apps"></span>Properties
                                    </a>
                                </li>
                    </ul>
                </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#components-links"' :
                            'data-bs-target="#xs-components-links"' }>
                            <span class="icon ion-md-cog"></span>
                            <span>Components</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? 'id="components-links"' : 'id="xs-components-links"' }>
                            <li class="link">
                                <a href="components/AppComponent.html" data-type="entity-link" >AppComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/CourseForumComponent.html" data-type="entity-link" >CourseForumComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/CourseStatisticsComponent.html" data-type="entity-link" >CourseStatisticsComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/CurriculumComponent.html" data-type="entity-link" >CurriculumComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/CurriculumDeveloperComponent.html" data-type="entity-link" >CurriculumDeveloperComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/CurriculumVisualizationComponent.html" data-type="entity-link" >CurriculumVisualizationComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/DialogComponent.html" data-type="entity-link" >DialogComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/ElectronicControllerComponent.html" data-type="entity-link" >ElectronicControllerComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/ForumComponent.html" data-type="entity-link" >ForumComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/LoginComponent.html" data-type="entity-link" >LoginComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/MenuComponent.html" data-type="entity-link" >MenuComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/MessagesComponent.html" data-type="entity-link" >MessagesComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/OptimalizationComponent.html" data-type="entity-link" >OptimalizationComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/ProfileComponent.html" data-type="entity-link" >ProfileComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/RegistrationComponent.html" data-type="entity-link" >RegistrationComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/StatisticsComponent.html" data-type="entity-link" >StatisticsComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/SubjectTopicComponent.html" data-type="entity-link" >SubjectTopicComponent</a>
                            </li>
                        </ul>
                    </li>
                        <li class="chapter">
                            <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#injectables-links"' :
                                'data-bs-target="#xs-injectables-links"' }>
                                <span class="icon ion-md-arrow-round-down"></span>
                                <span>Injectables</span>
                                <span class="icon ion-ios-arrow-down"></span>
                            </div>
                            <ul class="links collapse " ${ isNormalMode ? 'id="injectables-links"' : 'id="xs-injectables-links"' }>
                                <li class="link">
                                    <a href="injectables/AuthService.html" data-type="entity-link" >AuthService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/CourseForumService.html" data-type="entity-link" >CourseForumService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/CourseService.html" data-type="entity-link" >CourseService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/CurriculumService.html" data-type="entity-link" >CurriculumService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/GradeService.html" data-type="entity-link" >GradeService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/OptimalizationService.html" data-type="entity-link" >OptimalizationService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/StatisticsService.html" data-type="entity-link" >StatisticsService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/SubjectMatterService.html" data-type="entity-link" >SubjectMatterService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/TranslationService.html" data-type="entity-link" >TranslationService</a>
                                </li>
                            </ul>
                        </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#interfaces-links"' :
                            'data-bs-target="#xs-interfaces-links"' }>
                            <span class="icon ion-md-information-circle-outline"></span>
                            <span>Interfaces</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? ' id="interfaces-links"' : 'id="xs-interfaces-links"' }>
                            <li class="link">
                                <a href="interfaces/Category.html" data-type="entity-link" >Category</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ColumnOption.html" data-type="entity-link" >ColumnOption</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Course.html" data-type="entity-link" >Course</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Course-1.html" data-type="entity-link" >Course</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/CourseForum.html" data-type="entity-link" >CourseForum</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Curriculum.html" data-type="entity-link" >Curriculum</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/DistributionResponse.html" data-type="entity-link" >DistributionResponse</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ElectronicController.html" data-type="entity-link" >ElectronicController</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Forum.html" data-type="entity-link" >Forum</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Grade.html" data-type="entity-link" >Grade</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/GradeApiResponse.html" data-type="entity-link" >GradeApiResponse</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/LinearRegressionResponse.html" data-type="entity-link" >LinearRegressionResponse</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/LinearRegressionResponse-1.html" data-type="entity-link" >LinearRegressionResponse</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Name.html" data-type="entity-link" >Name</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Optimalization.html" data-type="entity-link" >Optimalization</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/OptimizedPlan.html" data-type="entity-link" >OptimizedPlan</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/OptimizedPlanResponse.html" data-type="entity-link" >OptimizedPlanResponse</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Options.html" data-type="entity-link" >Options</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/PaginatedResponse.html" data-type="entity-link" >PaginatedResponse</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ProgressResponse.html" data-type="entity-link" >ProgressResponse</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Semester.html" data-type="entity-link" >Semester</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Semester-1.html" data-type="entity-link" >Semester</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Specialization.html" data-type="entity-link" >Specialization</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/SubjectMatter.html" data-type="entity-link" >SubjectMatter</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Subtask.html" data-type="entity-link" >Subtask</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/TANResponse.html" data-type="entity-link" >TANResponse</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Task.html" data-type="entity-link" >Task</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/User.html" data-type="entity-link" >User</a>
                            </li>
                        </ul>
                    </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#miscellaneous-links"'
                            : 'data-bs-target="#xs-miscellaneous-links"' }>
                            <span class="icon ion-ios-cube"></span>
                            <span>Miscellaneous</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? 'id="miscellaneous-links"' : 'id="xs-miscellaneous-links"' }>
                            <li class="link">
                                <a href="miscellaneous/enumerations.html" data-type="entity-link">Enums</a>
                            </li>
                            <li class="link">
                                <a href="miscellaneous/functions.html" data-type="entity-link">Functions</a>
                            </li>
                            <li class="link">
                                <a href="miscellaneous/typealiases.html" data-type="entity-link">Type aliases</a>
                            </li>
                            <li class="link">
                                <a href="miscellaneous/variables.html" data-type="entity-link">Variables</a>
                            </li>
                        </ul>
                    </li>
                    <li class="chapter">
                        <a data-type="chapter-link" href="coverage.html"><span class="icon ion-ios-stats"></span>Documentation coverage</a>
                    </li>
                    <li class="divider"></li>
                    <li class="copyright">
                        Documentation generated using <a href="https://compodoc.app/" target="_blank" rel="noopener noreferrer">
                            <img data-src="images/compodoc-vectorise.png" class="img-responsive" data-type="compodoc-logo">
                        </a>
                    </li>
            </ul>
        </nav>
        `);
        this.innerHTML = tp.strings;
    }
});