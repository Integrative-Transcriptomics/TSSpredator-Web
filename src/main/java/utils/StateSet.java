
package utils;

import java.util.ArrayList;
import java.util.List;

/**
 * StateSet
 * Description:
 * This StateSet is a slim and simple version of a Set, without all
 * the functions from the Set-interface which are not necessary in
 * our case. This set stores objects of type ITssState only and
 * holds only one subtype of ITssState in the set.
 *
 * @author fillinger
 * @version ${VERSION}
 *          Date: 2/22/16
 *          EMail: sven.fillinger@student.uni-tuebingen.de
 */
public class StateSet {

    private ArrayList<ITssState> myStates;

    public StateSet(){
        myStates = new ArrayList<>();
    }

    /**
     * Adds a state if not already in set. Overwrites
     * existing state else.
     * @param o An state object of type ITssState
     */
    public void addState(ITssState o){
        boolean stateInList = false;

        if(myStates.isEmpty()){
            myStates.add(o);
        } else{
            int index = 0;
            for(ITssState state : myStates){
                if(state.equals(o)){
                    this.myStates.remove(index);
                    this.myStates.add(state);
                    stateInList = true;
                    break;
                }
                index++;
            }
            if(!stateInList) {
                myStates.add(o);
            }
        }
    }

    public List<ITssState> getStateList(){
        return new ArrayList<>(this.myStates);
    }
}
