
package utils;

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
public interface ITssState {

    boolean closestGeneOnSameContig(ArrayList<String> fastaIDList, MultiContigHandler handler, int... index);

    String getStateType();

}
