import { getProjectBySlug } from '../data/selectors';

export type ProjectTagProps = { slug: string };

/** Renders the slug pill. Picks up the thread's selected colour from the
 *  store automatically — call sites don't have to thread it through. */
export const ProjectTag = ({ slug }: ProjectTagProps) => {
  const project = getProjectBySlug(slug);
  const colorClass = project?.color ? ` km-proj-${project.color}` : '';
  return <span className={`km-proj${colorClass}`}>{slug}</span>;
};

export default ProjectTag;
