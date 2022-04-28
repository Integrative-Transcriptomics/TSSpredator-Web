
package utils;

import tss.TSS;
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
public class PrimarySecondaryState implements ITssState, Comparable<ITssState>{

    private TSS tss;

    private static final String STATE_TYPE = "PRIMARYSECONDARY";

    public PrimarySecondaryState(TSS tss){
        this.tss = tss;
    }

    @Override
    public boolean closestGeneOnSameContig(ArrayList<String> fastaIDList,
                                           MultiContigHandler handler, int... index) {
        boolean onSameContig = false;

        String fastaIDGene = fastaIDList.get(handler.getSuperContigMap().get((tss.getUTRgene().getStart()-1)*2 +1));

        String fastaIDTss = fastaIDList.get(handler.getSuperContigMap().get((tss.getPos()-1)*2 +1));

        /* If both positions map to the same contig, then the gene
        is on the same contig as the TSS and the clasification of the TSS
        as Secondary or primary is valid. Returns false if not.
         */
        if(fastaIDGene.equalsIgnoreCase(fastaIDTss)){
            onSameContig = true;
        }

        return onSameContig;
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
