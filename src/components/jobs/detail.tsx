import { useParams } from 'react-router-dom';
import { AppDispatch, useAppSelector } from '../../store';
import { RootState } from '../../store/reducers';
import { RequirementDetails } from '../../store/model/requirement-details.types';
import { useEffect, useState } from 'react';
import { clientLocationdetailPayload } from '../../store/model/client-location.types';
import { useDispatch } from 'react-redux';
import { fetchAllRequirement } from '../../store/action/requirement-details.action';
import { fetchClientLocations } from '../../store/action/client-location.action';

const JobDetail: React.FC = () => {
  //global state
  const { requirements } = useAppSelector((state: RootState) => state.requirementsSelector);
  const { clientLocations } =
    useAppSelector((state: RootState) => state?.clientLocationSelector) || {};

  const params = useParams();
  const id = params.id;
  const dispatch = useDispatch<AppDispatch>();

  //local state
  const [req, setReq] = useState<RequirementDetails>();
  const [loction, setLoction] = useState<string[]>();

  useEffect(() => {
    if (id) {
      const filterReq = requirements.find((req: RequirementDetails) => req.id === parseInt(id));
      setReq(filterReq);
      const filterLoc = clientLocations.find(
        (loc: clientLocationdetailPayload) => loc.clientProfile.id === filterReq.client.id
      );
      const string = filterLoc?.location.split(',');
      setLoction(string);
    }
  }, [id]);

  useEffect(() => {
    const fetchStart = async () => {
      await dispatch(fetchClientLocations());
      await dispatch(fetchAllRequirement());
    };
    fetchStart();
  }, [dispatch]);

  return (
    <div className="jobmain">
      <div className="jobHead">
        <div className="jobh1">
          <h4>{req?.positionDetails?.positionName ?? ''}</h4>
        </div>
        <div className="jobh2"></div>
      </div>
      <div className="jobbody">
        <div className="jobbdy1">
          <div className="jbodyimg">
            <img src="/src/assets/img.jpg" alt="" />
          </div>
        </div>
        <div className="jobbdy2">
          <div className="jobbdy21">
            <h5>{req?.client.clientName ?? ''}</h5>
          </div>
          <div className="jobbdy22">
            <div className="jblocans">
              {loction &&
                loction.map((item: string) => {
                  return <span>{item}</span>;
                })}
            </div>
          </div>
        </div>
      </div>
      <div className="jobfot">
        <span>About this role</span>
        <p>
          Lorem ipsum dolor sit amet consectetur adipisicing elit. Sint minima exercitationem nisi
          hic vero sunt facilis itaque doloremque labore molestiae! Mollitia praesentium eum
          laudantium reiciendis amet aspernatur a quis name. Lorem ipsum dolor sit amet consectetur
          adipisicing elit. Voluptatum aliquam quaerat officia dicta labore rem quia reprehenderit
          possimus itaque enim sunt laborum, voluptate, suscipit eius nesciunt adipisci dolor
          expedita porro.
        </p>
        {/* <p>
                    {req?.positionDetails?.description ?? ''}
                </p> */}

        <div className="qli">
          <span>Qualification</span>
          <ul className="thingsli">
            <li>Focus on intuitive, user-friendly interface design.</li>
            <li>Proficient in design tools like Figma, Sketch.</li>
            <li>Collaborates with developers to ensure functionality.</li>
            <li>Maintains consistency with brand identity and visuals.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default JobDetail;
