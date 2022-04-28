
package utils;

import utils.ITssState;

import java.util.ArrayList;

import contighandlerNew.MultiContigHandler;

/**
 * tss-predator
 * Description:
 *
 * @author fillinger
 * @version ${VERSION}
 *          Date: 2/17/16
 *          EMail: sven.fillinger@student.uni-tuebingen.de
 */
public class OtherState implements ITssState, Comparable<ITssState> {

    private static final String STATE_TYPE = "OTHERSTATE";

    @Override
    public boolean closestGeneOnSameContig(ArrayList<String> fastaIDList,
                                           MultiContigHandler handler, int... index) {
        return true;
    }

    @Override
    public String getStateType() {
        return STATE_TYPE;
    }

    @Override
    public int compareTo(ITssState o) {
        if(this.getStateType().equals(o.getStateType())){
            return 0;
        } else {
            return 1;
        }
    }
}
