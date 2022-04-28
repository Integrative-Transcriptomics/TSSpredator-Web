
package utils;

import tss.TSS;

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
public class AntiSenseState implements ITssState, Comparable<ITssState>{

    private TSS tss;

    private static final String STATE_TYPE = "ANTISENSE";

    public AntiSenseState(TSS tss){
        this.tss = tss;
    }

    @Override
    public boolean closestGeneOnSameContig(ArrayList<String> fastaIDList,
                                           MultiContigHandler handler, int... index) {
        if(index == null || index.length != 1){
            System.err.println("Error in sameContig check. No index provided or wrong size.");
            return false;
        }
        boolean onSameContig;

        // Get the FASTA ID of the original contig of the gene
        String fastaIDGene = fastaIDList.get(handler.getSuperContigMap().get((tss.getAntisenseGenes().get(index[0]).getStart()-1)*2 +1));
        // Get the FASTA ID of the original contig of the TSS
        String fastaIDTss = fastaIDList.get(handler.getSuperContigMap().get((tss.getPos()-1)*2 +1));

        if(fastaIDTss.equalsIgnoreCase(fastaIDGene)){
            onSameContig = true;
        } else{
            onSameContig = false;
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
